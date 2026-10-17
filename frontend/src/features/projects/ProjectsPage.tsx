import { useEffect, useState, type FormEvent } from "react";
import { Calendar, FolderKanban, Plus, Search } from "lucide-react";

import { api } from "../../api";
import { Avatar, EmptyState, Modal, PageHeader } from "../../components";
import type { Project, ProjectStatus } from "../../types";
import { formatDueDate } from "../../utils";

const statusLabel: Record<ProjectStatus, string> = { PLANNING: "Lập kế hoạch", ACTIVE: "Đang thực hiện", COMPLETED: "Hoàn thành", ARCHIVED: "Đã lưu trữ" };

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const load = () => api.projects().then((page) => setProjects(page.results));
  useEffect(() => { void load(); }, []);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await api.createProject(data); setOpen(false); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo dự án."); }
  };
  const visible = projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase()));

  return <div className="page-enter">
    <PageHeader eyebrow="Danh mục dự án" title="Dự án của đội ngũ" description="Một nơi để kiểm soát phạm vi, thời hạn và người chịu trách nhiệm." actions={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Tạo dự án</button>} />
    <div className="toolbar"><label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm dự án..." /></label><span>{visible.length} dự án</span></div>
    <section className="project-grid">
      {visible.map((project, index) => <article className="project-card" key={project.id}>
        <div className="project-card-head"><span className={`folder-icon color-${index % 3}`}><FolderKanban size={22} /></span><span className={`status-badge status-${project.status.toLowerCase()}`}>{statusLabel[project.status]}</span></div>
        <h2>{project.name}</h2><p>{project.description || "Chưa có mô tả dự án."}</p>
        <div className="project-dates"><span><Calendar size={15} /> {formatDueDate(project.due_date)}</span></div>
        <footer><span><Avatar user={project.owner} size="sm" /><small>{project.owner.full_name}</small></span><button>Xem chi tiết</button></footer>
      </article>)}
      {!visible.length && <EmptyState title="Chưa có dự án" text="Tạo dự án đầu tiên để bắt đầu" />}
    </section>
    <Modal title="Tạo dự án mới" open={open} onClose={() => setOpen(false)}><form className="modal-form" onSubmit={create}>
      <label>Tên dự án<input name="name" required placeholder="Ví dụ: Website nội bộ" /></label>
      <label>Mô tả<textarea name="description" rows={3} placeholder="Mục tiêu và phạm vi chính" /></label>
      <div className="form-row"><label>Ngày bắt đầu<input name="start_date" type="date" /></label><label>Hạn hoàn thành<input name="due_date" type="date" /></label></div>
      <label>Trạng thái<select name="status" defaultValue="PLANNING"><option value="PLANNING">Lập kế hoạch</option><option value="ACTIVE">Đang thực hiện</option></select></label>
      {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button">Tạo dự án</button></div>
    </form></Modal>
  </div>;
}

