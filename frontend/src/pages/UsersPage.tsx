import { useEffect, useState, type FormEvent } from "react";
import { Plus, ShieldCheck } from "lucide-react";

import { api } from "../api";
import { Avatar, Modal, PageHeader } from "../components";
import type { Role, User } from "../types";

const roleLabel: Record<Role, string> = { ADMIN: "Quản trị viên", PROJECT_MANAGER: "Quản lý dự án", MEMBER: "Thành viên" };

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const load = () => api.users().then((page) => setUsers(page.results));
  useEffect(() => { void load(); }, []);
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    try { await api.createUser(Object.fromEntries(new FormData(event.currentTarget))); setOpen(false); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo người dùng."); }
  };
  return <div className="page-enter"><PageHeader eyebrow="Quản trị hệ thống" title="Người dùng" description="Quản lý tài khoản và vai trò truy cập trong TaskFlow." actions={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Thêm người dùng</button>} />
    <section className="panel user-table-panel"><div className="table-meta"><strong>{users.length} tài khoản</strong><span><ShieldCheck size={16} /> Phân quyền đang hoạt động</span></div><div className="table-scroll"><table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tham gia</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><span className="user-cell"><Avatar user={user} /><span><strong>{user.full_name}</strong><small>{user.email}</small></span></span></td><td><span className="role-pill">{roleLabel[user.role]}</span></td><td><span className={`active-state ${user.is_active ? "active" : ""}`}><i />{user.is_active ? "Hoạt động" : "Đã khóa"}</span></td><td>{user.date_joined ? new Intl.DateTimeFormat("vi-VN").format(new Date(user.date_joined)) : "—"}</td></tr>)}</tbody></table></div></section>
    <Modal title="Thêm người dùng" open={open} onClose={() => setOpen(false)}><form className="modal-form" onSubmit={create}><label>Họ và tên<input name="full_name" required /></label><label>Email<input type="email" name="email" required /></label><div className="form-row"><label>Vai trò<select name="role" defaultValue="MEMBER"><option value="MEMBER">Thành viên</option><option value="PROJECT_MANAGER">Quản lý dự án</option><option value="ADMIN">Quản trị viên</option></select></label><label>Mật khẩu<input type="password" name="password" required minLength={8} /></label></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button">Tạo tài khoản</button></div></form></Modal>
  </div>;
}

