import { useState, type ReactNode } from "react";
import { Bell, FolderKanban, LayoutDashboard, ListChecks, LogOut, Menu, Users, X, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Avatar } from "../components";
import { useAuth } from "../features/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

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
        <div className="sidebar-note"><span>TIẾN ĐỘ TUẦN</span><strong>Đúng kế hoạch</strong><div><i /></div><small>7/10 mục tiêu đã đạt</small></div>
        <div className="sidebar-user"><Avatar user={user} /><span><strong>{user.full_name}</strong><small>{user.role === "ADMIN" ? "Quản trị viên" : user.role === "PROJECT_MANAGER" ? "Quản lý dự án" : "Thành viên"}</small></span><button onClick={() => void logout()} aria-label="Đăng xuất"><LogOut size={17} /></button></div>
      </aside>
      {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />}
      <section className="main-column">
        <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Mở menu"><Menu /></button><div className="topbar-spacer" /><button className="notification-button" aria-label="Thông báo"><Bell size={19} /><i /></button><span className="today">{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date())}</span></header>
        <main className="page-content">{children}</main>
      </section>
    </div>
  );
}

