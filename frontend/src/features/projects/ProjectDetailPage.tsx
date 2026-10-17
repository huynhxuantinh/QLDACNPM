import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, FolderArchive, Pencil, Plus, UsersRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../../api";
import { Avatar, EmptyState, Modal } from "../../components";
import type { Project, ProjectMember, ProjectStatus, Task, TaskStatus } from "../../types";
import { formatDueDate, projectProgress } from "../../utils";
import { useAuth } from "../auth";
import { TaskBoard } from "../tasks";
import { ProjectMembers } from "./ProjectMembers";

const statusLabel: Record<ProjectStatus, string> = { PLANNING: "Lập kế hoạch", ACTIVE: "Đang thực hiện", COMPLETED: "Hoàn thành", ARCHIVED: "Đã lưu trữ" };

export function ProjectDetailPage() {
  const projectId = Number(useParams().id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [projectData, memberData, taskPage] = await Promise.all([api.project(projectId), api.projectMembers(projectId), api.tasks(`project=${projectId}`)]);
    setProject(projectData); setMembers(memberData); setTasks(taskPage.results);
  };
  useEffect(() => { if (projectId) void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Không thể tải dự án.")); }, [projectId]);

  if (!project) return <div className="detail-loading">{error || "Đang tải dự án..."}</div>;
  const canManage = user?.role === "ADMIN" || project.owner.id === user?.id;
  const progress = projectProgress(tasks);

  const update = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    try { await api.updateProject(project.id, Object.fromEntries(new FormData(event.currentTarget))); setEditOpen(false); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể cập nhật dự án."); }
  };
  const addMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const id = Number(new FormData(event.currentTarget).get("user_id"));
    try { await api.addProjectMember(project.id, id); setMemberOpen(false); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể thêm thành viên."); }
  };
  const removeMember = async (userId: number) => {
    setError("");
    try { await api.removeProjectMember(project.id, userId); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xóa thành viên."); }
  };
  const changeStatus = async (id: number, status: TaskStatus) => {
    setError("");
    try { const updated = await api.updateTaskStatus(id, status); setTasks((items) => items.map((item) => item.id === id ? updated : item)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể đổi trạng thái."); }
  };
  const archive = async () => { await api.archiveProject(project.id); navigate("/projects"); };

  return <div className="page-enter project-detail">
    <Link className="back-link" to="/projects"><ArrowLeft size={16} /> Quay lại dự án</Link>
    <section className="detail-hero">
      <div><span className={`status-badge status-${project.status.toLowerCase()}`}>{statusLabel[project.status]}</span><h1>{project.name}</h1><p>{project.description || "Chưa có mô tả dự án."}</p></div>
      {canManage && <div className="detail-actions"><button className="ghost-button" onClick={() => setEditOpen(true)}><Pencil size={15} /> Chỉnh sửa</button><button className="danger-ghost" onClick={() => setArchiveOpen(true)}><FolderArchive size={15} /> Lưu trữ</button></div>}
    </section>
    {error && <p className="inline-alert">{error}</p>}
    <section className="detail-stats">
      <article><CalendarDays size={19} /><span><small>Hạn hoàn thành</small><strong>{formatDueDate(project.due_date)}</strong></span></article>
      <article><UsersRound size={19} /><span><small>Thành viên</small><strong>{members.length} người</strong></span></article>
      <article><CheckCircle2 size={19} /><span><small>Tiến độ</small><strong>{progress}%</strong></span><div className="detail-progress"><i style={{ width: `${progress}%` }} /></div></article>
      <article><Avatar user={project.owner} /><span><small>Chủ dự án</small><strong>{project.owner.full_name}</strong></span></article>
    </section>

    <section className="detail-grid">
      <article className="panel member-panel"><header><div><p className="panel-kicker">Đội ngũ</p><h2>Thành viên dự án</h2></div>{canManage && <button className="small-add" onClick={() => setMemberOpen(true)}><Plus size={14} /> Thêm</button>}</header><ProjectMembers members={members} canManage={canManage} ownerId={project.owner.id} onRemove={(id) => void removeMember(id)} /></article>
      <article className="panel activity-panel"><header><div><p className="panel-kicker">Tóm tắt</p><h2>Phân bổ công việc</h2></div><Link to={`/tasks?project=${project.id}`}>Mở bảng việc</Link></header>
        <div className="activity-bars">{(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as TaskStatus[]).map((status) => { const count = tasks.filter((task) => task.status === status).length; return <div key={status}><span>{status === "TODO" ? "Cần làm" : status === "IN_PROGRESS" ? "Đang làm" : status === "REVIEW" ? "Chờ duyệt" : "Hoàn thành"}</span><div><i style={{ width: `${tasks.length ? Math.max(5, count / tasks.length * 100) : 0}%` }} /></div><b>{count}</b></div>; })}</div>
      </article>
    </section>
    <section className="detail-board"><div className="section-title"><div><p className="panel-kicker">Thực thi</p><h2>Công việc dự án</h2></div><span>{tasks.length} công việc</span></div>{tasks.length ? <TaskBoard tasks={tasks} onStatusChange={(id, status) => void changeStatus(id, status)} /> : <EmptyState title="Chưa có công việc" text="Tạo công việc từ bảng Kanban" />}</section>

    <Modal title="Chỉnh sửa dự án" open={editOpen} onClose={() => setEditOpen(false)}><form className="modal-form" onSubmit={update}><label>Tên dự án<input name="name" defaultValue={project.name} required /></label><label>Mô tả<textarea name="description" rows={3} defaultValue={project.description} /></label><div className="form-row"><label>Ngày bắt đầu<input name="start_date" type="date" defaultValue={project.start_date ?? ""} /></label><label>Hạn hoàn thành<input name="due_date" type="date" defaultValue={project.due_date ?? ""} /></label></div><label>Trạng thái<select name="status" defaultValue={project.status}><option value="PLANNING">Lập kế hoạch</option><option value="ACTIVE">Đang thực hiện</option><option value="COMPLETED">Hoàn thành</option><option value="ARCHIVED">Đã lưu trữ</option></select></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setEditOpen(false)}>Hủy</button><button className="primary-button">Lưu thay đổi</button></div></form></Modal>
    <Modal title="Thêm thành viên" open={memberOpen} onClose={() => setMemberOpen(false)}><form className="modal-form" onSubmit={addMember}><label>ID người dùng<input name="user_id" type="number" min="1" required placeholder="Ví dụ: 3" /></label><p className="form-hint">ID hiển thị trong trang Người dùng của quản trị viên.</p>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setMemberOpen(false)}>Hủy</button><button className="primary-button">Thêm thành viên</button></div></form></Modal>
    <Modal title="Lưu trữ dự án?" open={archiveOpen} onClose={() => setArchiveOpen(false)}><div className="confirm-content"><p>Dự án <strong>{project.name}</strong> sẽ chuyển sang trạng thái lưu trữ.</p><div className="modal-actions"><button className="ghost-button" onClick={() => setArchiveOpen(false)}>Hủy</button><button className="danger-button" onClick={() => void archive()}>Lưu trữ dự án</button></div></div></Modal>
  </div>;
}

