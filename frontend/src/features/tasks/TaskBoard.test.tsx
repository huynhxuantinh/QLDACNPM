import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskBoard } from "./TaskBoard";
import type { Task } from "../../types";

const tasks: Task[] = [
  {
    id: 1,
    project: 1,
    title: "Thiết kế database",
    description: "Hoàn thiện ERD",
    assignee: { id: 2, email: "member@taskflow.local", full_name: "Minh Anh", role: "MEMBER", avatar_url: "", is_active: true },
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
    render(<TaskBoard tasks={tasks} onStatusChange={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Cần làm" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Đang làm" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chờ duyệt" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hoàn thành" })).toBeInTheDocument();
    expect(screen.getByText("Thiết kế database")).toBeInTheDocument();
    expect(screen.getByText("Minh Anh")).toBeInTheDocument();
  });

  it("emits a status update selected by the user", async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();
    render(<TaskBoard tasks={tasks} onStatusChange={onStatusChange} />);

    await user.selectOptions(screen.getByLabelText("Trạng thái Thiết kế database"), "DONE");
    expect(onStatusChange).toHaveBeenCalledWith(1, "DONE");
  });
});

