import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";

import { api } from "../../api";
import { Modal, PageHeader } from "../../components";
import type { Priority, Project, ProjectMember, Task, TaskStatus } from "../../types";
import { TaskBoard } from "./TaskBoard";

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priority, setPriority] = useState<"" | Priority>("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = () => Promise.all([api.tasks(), api.projects()]).then(([taskPage, projectPage]) => { setTasks(taskPage.results); setProjects(projectPage.results); });
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => tasks.filter((task) => (!search || `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())) && (!projectFilter || task.project === Number(projectFilter)) && (!priority || task.priority === priority)), [tasks, search, projectFilter, priority]);

  const changeStatus = async (id: number, status: TaskStatus) => {
    try {
      const updated = await api.updateTaskStatus(id, status);
      setTasks((items) => items.map((task) => task.id === id ? updated : task));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể đổi trạng thái."); }
  };
  const loadMembers = async (projectId: string) => setMembers(projectId ? await api.projectMembers(Number(projectId)) : []);
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { ...values, project: Number(values.project), assignee_id: values.assignee_id ? Number(values.assignee_id) : null, due_date: values.due_date ? new Date(String(values.due_date)).toISOString() : null };
    try { await api.createTask(payload); setOpen(false); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo công việc."); }
  };

  return <div className="page-enter wide-page">
    <PageHeader eyebrow="Luồng công việc" title="Bảng công việc" description="Điều phối nhiệm vụ qua từng trạng thái và nhìn thấy điểm nghẽn ngay lập tức." actions={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Thêm công việc</button>} />
    <div className="board-toolbar">
      <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm công việc..." /></label>
      <label className="filter-control"><Filter size={16} /><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Tất cả dự án</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
      <label className="filter-control"><SlidersHorizontal size={16} /><select value={priority} onChange={(event) => setPriority(event.target.value as "" | Priority)}><option value="">Mọi ưu tiên</option><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select></label>
      <span className="result-count">{visible.length} việc</span>
    </div>
    {error && <p className="inline-alert">{error}</p>}
    <TaskBoard tasks={visible} onStatusChange={(id, status) => void changeStatus(id, status)} />
    <Modal title="Tạo công việc mới" open={open} onClose={() => setOpen(false)}><form className="modal-form" onSubmit={create}>
      <label>Tiêu đề<input name="title" required placeholder="Công việc cần hoàn thành" /></label>
      <label>Mô tả<textarea name="description" rows={3} placeholder="Kết quả mong đợi" /></label>
      <label>Dự án<select name="project" required defaultValue="" onChange={(event) => void loadMembers(event.target.value)}><option value="" disabled>Chọn dự án</option>{projects.filter((project) => project.status !== "ARCHIVED").map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
      <div className="form-row"><label>Người phụ trách<select name="assignee_id" defaultValue=""><option value="">Chưa giao</option>{members.map((member) => <option value={member.user.id} key={member.id}>{member.user.full_name}</option>)}</select></label><label>Ưu tiên<select name="priority" defaultValue="MEDIUM"><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select></label></div>
      <label>Hạn hoàn thành<input name="due_date" type="datetime-local" /></label>
      {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button">Tạo công việc</button></div>
    </form></Modal>
  </div>;
}

