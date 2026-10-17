import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Avatar } from "./Avatar";
import { Modal } from "./Modal";
import { PageHeader } from "./PageHeader";
import type { User } from "../types";

const user: User = { id: 1, email: "a@b.com", full_name: "Nguyễn Minh Anh", role: "MEMBER", avatar_url: "", is_active: true };

describe("shared components", () => {
  it("renders initials or an avatar image", () => {
    const { rerender } = render(<Avatar user={user} />);
    expect(screen.getByText("MA")).toBeInTheDocument();
    rerender(<Avatar user={{ ...user, avatar_url: "https://example.com/avatar.png" }} />);
    expect(screen.getByRole("img", { name: user.full_name })).toBeInTheDocument();
  });

  it("shows a page heading and actions", () => {
    render(<PageHeader eyebrow="Khu vực" title="Tiêu đề" description="Mô tả" actions={<button>Thêm</button>} />);
    expect(screen.getByRole("heading", { name: "Tiêu đề" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm" })).toBeInTheDocument();
  });

  it("closes a modal with Escape", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Modal title="Tạo mới" open={false} onClose={onClose}>Nội dung</Modal>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<Modal title="Tạo mới" open onClose={onClose}>Nội dung</Modal>);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});

