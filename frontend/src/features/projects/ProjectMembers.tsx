import { Trash2, UserRound } from "lucide-react";

import { Avatar, EmptyState } from "../../components";
import type { ProjectMember } from "../../types";

const roleLabel = { ADMIN: "Quản trị viên", PROJECT_MANAGER: "Quản lý dự án", MEMBER: "Thành viên" };

export function ProjectMembers({ members, canManage, ownerId, onRemove }: { members: ProjectMember[]; canManage: boolean; ownerId?: number; onRemove: (userId: number) => void }) {
  if (!members.length) return <EmptyState title="Chưa có thành viên" text="Thêm người đầu tiên vào dự án" />;
  return <div className="member-list">
    {members.map((member) => <div className="member-row" key={member.id}>
      <Avatar user={member.user} />
      <span><strong>{member.user.full_name}</strong><small>{member.user.email}</small></span>
      <span className="member-role"><UserRound size={13} />{roleLabel[member.user.role]}</span>
      {canManage && member.user.id !== ownerId && <button className="danger-icon" aria-label={`Xóa ${member.user.full_name} khỏi dự án`} onClick={() => onRemove(member.user.id)}><Trash2 size={16} /></button>}
    </div>)}
  </div>;
}

