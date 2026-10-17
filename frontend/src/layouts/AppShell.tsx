import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Bell, Clock3, FolderKanban, LayoutDashboard, ListChecks, LogOut, Menu, Users, X, Zap } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { api } from "../api";
import { Avatar } from "../components";
import { useAuth } from "../features/auth";
import type { DashboardSummary, Task } from "../types";
import { formatDueDate, tasksNeedingAttention } from "../utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.dashboard(), api.tasks("ordering=due_date")])
      .then(([metrics, taskPage]) => {
        if (!active) return;
        setSummary(metrics);
        setTasks(taskPage.results);
      })
      .catch(() => { if (active) setDataError(true); });
    return () => { active = false; };
  }, []);

  if (!user) return null;

  const notifications = tasksNeedingAttention(tasks);

  const links = [
    { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
    { to: "/projects", label: "Dự án", icon: FolderKanban },
    { to: "/tasks", label: "Công việc", icon: ListChecks },
    ...(user.role === "ADMIN" ? [{ to: "/users", label: "Người dùng", icon: Users }] : []),
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand"><span><Zap size={19} fill="currentColor" /></span><strong>TaskFlow</strong><button onClick={() => setMenuOpen(false)} aria-label="Đóng menu"><X /></button></div>
        <p className="nav-caption">Không gian làm việc</p>
        <nav>{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
        <div className="sidebar-note"><span>TIẾN ĐỘ CÔNG VIỆC</span><strong>{summary ? `${Math.round(summary.completion_rate)}% hoàn thành` : dataError ? "Không thể tải" : "Đang tải..."}</strong><div><i style={{ width: `${summary?.completion_rate ?? 0}%` }} /></div><small>{summary ? `${summary.done}/${summary.total} công việc đã hoàn thành` : dataError ? "Vui lòng thử lại sau" : "Đang lấy dữ liệu thực tế"}</small></div>
        <div className="sidebar-user"><Avatar user={user} /><span><strong>{user.full_name}</strong><small>{user.role === "ADMIN" ? "Quản trị viên" : user.role === "PROJECT_MANAGER" ? "Quản lý dự án" : "Thành viên"}</small></span><button onClick={() => void logout()} aria-label="Đăng xuất"><LogOut size={17} /></button></div>
      </aside>
      {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />}
      <section className="main-column">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Mở menu"><Menu /></button>
          <div className="topbar-spacer" />
          <div className="notification-wrap">
            <button className="notification-button" aria-label={`Thông báo${notifications.length ? `, ${notifications.length} công việc cần chú ý` : ""}`} aria-expanded={notificationOpen} onClick={() => setNotificationOpen((value) => !value)}><Bell size={19} />{notifications.length > 0 && <i />}</button>
            {notificationOpen && <section className="notification-popover">
              <header><div><small>Cập nhật từ dữ liệu thật</small><h2>Thông báo công việc</h2></div><span>{notifications.length}</span></header>
              <div className="notification-list">
                {notifications.slice(0, 5).map((task) => {
                  const overdue = new Date(task.due_date!) < new Date();
                  return <Link to={`/tasks?project=${task.project}`} onClick={() => setNotificationOpen(false)} key={task.id}>
                    <span className={overdue ? "is-overdue" : "is-upcoming"}>{overdue ? <AlertTriangle size={15} /> : <Clock3 size={15} />}</span>
                    <div><strong>{task.title}</strong><small>{overdue ? "Đã quá hạn" : `Hạn ${formatDueDate(task.due_date)}`}</small></div>
                  </Link>;
                })}
                {!notifications.length && <p>{dataError ? "Không thể tải thông báo." : "Không có việc quá hạn hoặc sắp đến hạn."}</p>}
              </div>
              <Link className="notification-footer" to="/tasks" onClick={() => setNotificationOpen(false)}>Xem tất cả công việc</Link>
            </section>}
          </div>
          <span className="today">{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date())}</span>
        </header>
        <main className="page-content">{children}</main>
      </section>
    </div>
  );
}

