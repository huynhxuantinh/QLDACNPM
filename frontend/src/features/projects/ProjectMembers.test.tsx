import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectMembers } from "./ProjectMembers";
import type { ProjectMember } from "../../types";

const members: ProjectMember[] = [{
  id: 1,
  joined_at: "2026-10-01T00:00:00Z",
  user: { id: 2, email: "member@taskflow.local", full_name: "Thành viên", role: "MEMBER", avatar_url: "", is_active: true },
}];

describe("ProjectMembers", () => {
  it("shows members and allows managers to remove one", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<ProjectMembers members={members} canManage onRemove={onRemove} />);

    expect(screen.getByText("member@taskflow.local")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xóa Thành viên khỏi dự án" }));
    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it("hides destructive actions from regular members", () => {
    render(<ProjectMembers members={members} canManage={false} onRemove={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Xóa Thành viên/ })).not.toBeInTheDocument();
  });
});

