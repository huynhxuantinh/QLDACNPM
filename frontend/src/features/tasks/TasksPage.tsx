import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { api } from "../../api";
import { Modal, PageHeader } from "../../components";
import type { Priority, Project, ProjectMember, Task, TaskStatus } from "../../types";
import { TaskBoard } from "./TaskBoard";
import { useAuth } from "../auth";

export function TasksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(searchParams.get("project") ?? "");
  const [priority, setPriority] = useState<"" | Priority>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
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
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { ...values, project: Number(values.project), assignee_id: values.assignee_id ? Number(values.assignee_id) : null, due_date: values.due_date ? new Date(String(values.due_date)).toISOString() : null };
    try {
      if (editing) await api.updateTask(editing.id, payload);
      else await api.createTask(payload);
      setOpen(false); setEditing(null); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu công việc."); }
  };

  const startCreate = () => { setEditing(null); setMembers([]); setError(""); setOpen(true); };
  const startEdit = async (task: Task) => { setEditing(task); setError(""); setMembers(await api.projectMembers(task.project)); setOpen(true); };
  const remove = async () => {
    if (!deleting) return;
    try { await api.deleteTask(deleting.id); setDeleting(null); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xóa công việc."); setDeleting(null); }
  };
  const canManageTask = (task: Task) => user?.role === "ADMIN" || projects.find((project) => project.id === task.project)?.owner.id === user?.id;

  return <div className="page-enter wide-page">
    <PageHeader eyebrow="Luồng công việc" title="Bảng công việc" description="Điều phối nhiệm vụ qua từng trạng thái và nhìn thấy điểm nghẽn ngay lập tức." actions={user?.role !== "MEMBER" && <button className="primary-button" onClick={startCreate}><Plus size={17} /> Thêm công việc</button>} />
    <div className="board-toolbar">
      <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm công việc..." /></label>
      <label className="filter-control"><Filter size={16} /><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Tất cả dự án</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
      <label className="filter-control"><SlidersHorizontal size={16} /><select value={priority} onChange={(event) => setPriority(event.target.value as "" | Priority)}><option value="">Mọi ưu tiên</option><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select></label>
      <span className="result-count">{visible.length} việc</span>
    </div>
    {error && <p className="inline-alert">{error}</p>}
    <TaskBoard tasks={visible} onStatusChange={(id, status) => void changeStatus(id, status)} onEdit={(task) => void startEdit(task)} onDelete={setDeleting} canManageTask={canManageTask} />
    <Modal title={editing ? "Sửa công việc" : "Tạo công việc mới"} open={open} onClose={() => { setOpen(false); setEditing(null); }}><form className="modal-form" onSubmit={save}>
      <label>Tiêu đề<input name="title" required placeholder="Công việc cần hoàn thành" defaultValue={editing?.title} /></label>
      <label>Mô tả<textarea name="description" rows={3} placeholder="Kết quả mong đợi" defaultValue={editing?.description} /></label>
      <label>Dự án<select name="project" required defaultValue={editing?.project ?? ""} onChange={(event) => void loadMembers(event.target.value)}><option value="" disabled>Chọn dự án</option>{projects.filter((project) => project.status !== "ARCHIVED").map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
      <div className="form-row"><label>Người phụ trách<select name="assignee_id" defaultValue={editing?.assignee?.id ?? ""}><option value="">Chưa giao</option>{members.map((member) => <option value={member.user.id} key={member.id}>{member.user.full_name}</option>)}</select></label><label>Ưu tiên<select name="priority" defaultValue={editing?.priority ?? "MEDIUM"}><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select></label></div>
      <label>Hạn hoàn thành<input name="due_date" type="datetime-local" defaultValue={editing?.due_date ? editing.due_date.slice(0, 16) : ""} /></label>
      {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button">{editing ? "Lưu thay đổi" : "Tạo công việc"}</button></div>
    </form></Modal>
    <Modal title="Xóa công việc?" open={Boolean(deleting)} onClose={() => setDeleting(null)}><div className="confirm-content"><p>Công việc <strong>{deleting?.title}</strong> sẽ được đưa khỏi bảng.</p><div className="modal-actions"><button className="ghost-button" onClick={() => setDeleting(null)}>Hủy</button><button className="danger-button" onClick={() => void remove()}>Xóa công việc</button></div></div></Modal>
  </div>;
}

