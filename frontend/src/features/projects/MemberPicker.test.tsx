import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../api";
import type { ProjectMember } from "../../types";
import { MemberPicker } from "./MemberPicker";

vi.mock("../../api", () => ({
  api: {
    userOptions: vi.fn(),
    addProjectMember: vi.fn(),
  },
}));

const existingMembers: ProjectMember[] = [{
  id: 1,
  joined_at: "2026-10-01T00:00:00Z",
  user: { id: 2, email: "existing@example.com", full_name: "Đã tham gia", role: "MEMBER", avatar_url: "", is_active: true },
}];

describe("MemberPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.userOptions).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 2, email: "existing@example.com", full_name: "Đã tham gia", role: "MEMBER", avatar_url: "" },
        { id: 3, email: "available@example.com", full_name: "Có thể chọn", role: "MEMBER", avatar_url: "" },
      ],
    });
    vi.mocked(api.addProjectMember).mockResolvedValue({} as ProjectMember);
  });

  it("cho PM chọn người chưa thuộc dự án thay vì nhập ID", async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    render(<MemberPicker projectId={9} members={existingMembers} onAdded={onAdded} onCancel={vi.fn()} />);

    expect(await screen.findByRole("option", { name: "Có thể chọn — available@example.com" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Đã tham gia/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chọn người dùng"), "3");
    await user.click(screen.getByRole("button", { name: "Thêm thành viên" }));

    await waitFor(() => expect(api.addProjectMember).toHaveBeenCalledWith(9, 3));
    expect(onAdded).toHaveBeenCalledOnce();
  });

  it("tìm người dùng theo tên hoặc email", async () => {
    const user = userEvent.setup();
    render(<MemberPicker projectId={9} members={[]} onAdded={vi.fn()} onCancel={vi.fn()} />);

    await screen.findByRole("option", { name: /Có thể chọn/ });
    await user.type(screen.getByPlaceholderText("Nhập tên hoặc email"), "An");

    await waitFor(() => expect(api.userOptions).toHaveBeenLastCalledWith("An"));
  });

  it("hiển thị lỗi nếu không thể thêm thành viên", async () => {
    vi.mocked(api.addProjectMember).mockRejectedValueOnce(new Error("Không có quyền thêm"));
    const user = userEvent.setup();
    const onAdded = vi.fn();
    render(<MemberPicker projectId={9} members={existingMembers} onAdded={onAdded} onCancel={vi.fn()} />);

    await user.selectOptions(await screen.findByLabelText("Chọn người dùng"), "3");
    await user.click(screen.getByRole("button", { name: "Thêm thành viên" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Không có quyền thêm");
    expect(onAdded).not.toHaveBeenCalled();
  });
});
