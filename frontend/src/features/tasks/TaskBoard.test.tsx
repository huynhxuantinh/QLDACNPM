import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskBoard } from "./TaskBoard";
import type { Task, User } from "../../types";

const member: User = { id: 2, email: "member@taskflow.local", full_name: "Minh Anh", role: "MEMBER", avatar_url: "", is_active: true };
const manager: User = { id: 1, email: "manager@taskflow.local", full_name: "Quản lý", role: "PROJECT_MANAGER", avatar_url: "", is_active: true };

const tasks: Task[] = [
  {
    id: 1,
    project: 1,
    title: "Thiết kế database",
    description: "Hoàn thiện ERD",
    assignee: member,
    reporter: null,
    priority: "HIGH",
    status: "REVIEW",
    due_date: "2026-10-20T08:00:00Z",
    completed_at: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
];

describe("TaskBoard", () => {
  it("shows four workflow columns and task details", () => {
    render(<TaskBoard tasks={tasks} currentUser={member} onStatusChange={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Cần làm" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Đang làm" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chờ duyệt" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hoàn thành" })).toBeInTheDocument();
    expect(screen.getByText("Thiết kế database")).toBeInTheDocument();
    expect(screen.getByText("Minh Anh")).toBeInTheDocument();
  });

  it("chỉ cho PM chọn bước chuyển hợp lệ", async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();
    render(<TaskBoard tasks={tasks} currentUser={manager} canManageTask={() => true} onStatusChange={onStatusChange} />);

    const select = screen.getByLabelText("Trạng thái Thiết kế database");
    expect(select).toHaveTextContent("Đang làm");
    expect(select).toHaveTextContent("Chờ duyệt");
    expect(select).toHaveTextContent("Hoàn thành");
    expect(select).not.toHaveTextContent("Cần làm");

    await user.selectOptions(select, "DONE");
    expect(onStatusChange).toHaveBeenCalledWith(1, "DONE");
  });

  it("không cho Member tự duyệt hoặc mở lại công việc", () => {
    const doneTask = { ...tasks[0], id: 2, title: "Đã hoàn thành", status: "DONE" as const };
    render(<TaskBoard tasks={[tasks[0], doneTask]} currentUser={member} onStatusChange={vi.fn()} />);

    const reviewSelect = screen.getByLabelText("Trạng thái Thiết kế database");
    expect(reviewSelect).toBeDisabled();
    expect(reviewSelect).not.toHaveTextContent("Hoàn thành");

    const doneSelect = screen.getByLabelText("Trạng thái Đã hoàn thành");
    expect(doneSelect).toBeDisabled();
    expect(doneSelect).not.toHaveTextContent("Chờ duyệt");
  });

  it("exposes edit and delete actions for each task", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TaskBoard tasks={tasks} currentUser={manager} onStatusChange={vi.fn()} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Sửa Thiết kế database" }));
    await user.click(screen.getByRole("button", { name: "Xóa Thiết kế database" }));
    expect(onEdit).toHaveBeenCalledWith(tasks[0]);
    expect(onDelete).toHaveBeenCalledWith(tasks[0]);
  });
});

