import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCheck, CircleDashed, Clock3, ListTodo } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../../api";
import { Avatar, EmptyState, PageHeader } from "../../components";
import { useAuth } from "../auth";
import type { DashboardSummary, Project, Task } from "../../types";
import { formatDueDate, tasksNeedingAttention } from "../../utils";

const initialSummary: DashboardSummary = { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, overdue: 0, completion_rate: 0 };

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(initialSummary);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboard(), api.projects(), api.tasks("ordering=due_date")])
      .then(([metrics, projectPage, taskPage]) => { setSummary(metrics); setProjects(projectPage.results); setTasks(taskPage.results); })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.full_name.split(" ").at(-1) ?? "bạn";
  const kpis = [
    { label: "Tổng công việc", value: summary.total, icon: ListTodo, tone: "navy" },
    { label: "Đang thực hiện", value: summary.in_progress, icon: CircleDashed, tone: "blue" },
    { label: "Đã hoàn thành", value: summary.done, icon: CheckCheck, tone: "lime" },
    { label: "Quá hạn", value: summary.overdue, icon: AlertTriangle, tone: "coral" },
  ];
  const attentionTasks = tasksNeedingAttention(tasks);

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Bảng điều hành" title={`Chào ${firstName}, hôm nay mình làm gì?`} description="Theo dõi nhịp độ dự án và ưu tiên công việc quan trọng nhất." actions={<Link className="primary-button" to="/tasks">Xem bảng việc <ArrowUpRight size={17} /></Link>} />
      <section className="kpi-grid">
        {kpis.map(({ label, value, icon: Icon, tone }) => <article className="kpi-card" key={label}><span className={`kpi-icon tone-${tone}`}><Icon size={21} /></span><div><small>{label}</small><strong>{loading ? "—" : value}</strong></div></article>)}
      </section>

      <section className="dashboard-grid">
        <article className="panel progress-panel">
          <header><div><p className="panel-kicker">Hiệu suất chung</p><h2>Tiến độ hoàn thành</h2></div><span className="trend-pill">{loading ? "Đang tải" : `${summary.done}/${summary.total} công việc`}</span></header>
          <div className="progress-visual">
            <div className="progress-ring" style={{ "--progress": `${summary.completion_rate * 3.6}deg` } as React.CSSProperties}><span><strong>{Math.round(summary.completion_rate)}%</strong><small>hoàn thành</small></span></div>
            <div className="progress-legend">
              {[{ label: "Cần làm", value: summary.todo, cls: "todo" }, { label: "Đang làm", value: summary.in_progress, cls: "doing" }, { label: "Chờ duyệt", value: summary.review, cls: "review" }, { label: "Hoàn thành", value: summary.done, cls: "done" }].map((item) => <div key={item.label}><i className={item.cls} /><span>{item.label}</span><strong>{item.value}</strong></div>)}
            </div>
          </div>
        </article>

        <article className="panel deadlines-panel">
          <header><div><p className="panel-kicker">Sắp đến hạn</p><h2>Việc cần chú ý</h2></div><Link to="/tasks">Xem tất cả</Link></header>
          <div className="deadline-list">
            {attentionTasks.slice(0, 4).map((task) => <div className="deadline-item" key={task.id}><span className={`priority-bar priority-${task.priority.toLowerCase()}`} /><div><strong>{task.title}</strong><small><Clock3 size={13} /> {formatDueDate(task.due_date)}</small></div>{task.assignee && <Avatar user={task.assignee} size="sm" />}</div>)}
            {!attentionTasks.length && !loading && <EmptyState title="Không có việc gấp" text="Không có việc quá hạn hoặc đến hạn trong 7 ngày" />}
          </div>
        </article>
      </section>

      <section className="panel projects-snapshot">
        <header><div><p className="panel-kicker">Danh mục</p><h2>Dự án đang chạy</h2></div><Link to="/projects">Quản lý dự án <ArrowUpRight size={15} /></Link></header>
        <div className="project-strip">
          {projects.slice(0, 3).map((project, index) => {
            const projectTasks = tasks.filter((task) => task.project === project.id);
            const done = projectTasks.filter((task) => task.status === "DONE").length;
            const progress = projectTasks.length ? Math.round(done / projectTasks.length * 100) : 0;
            return <article className="mini-project" key={project.id}><span className={`project-index color-${index % 3}`}>0{index + 1}</span><div><strong>{project.name}</strong><small>{project.owner.full_name} · {projectTasks.length} công việc</small><div className="mini-progress"><i style={{ width: `${progress}%` }} /></div></div><b>{progress}%</b></article>;
          })}
        </div>
      </section>
    </div>
  );
}

