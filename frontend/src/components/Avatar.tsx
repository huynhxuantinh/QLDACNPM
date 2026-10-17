import type { User } from "../types";
import { initials } from "../utils";

export function Avatar({ user, size = "md" }: { user: User; size?: "sm" | "md" }) {
  if (user.avatar_url) return <img className={`avatar avatar-${size}`} src={user.avatar_url} alt={user.full_name} />;
  return <span className={`avatar avatar-${size}`} aria-label={user.full_name}>{initials(user.full_name)}</span>;
}
