import { render, screen } from "@testing-library/react";
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

    expect(screen.getByText("Cần làm")).toBeInTheDocument();
    expect(screen.getByText("Đang làm")).toBeInTheDocument();
    expect(screen.getByText("Chờ duyệt")).toBeInTheDocument();
    expect(screen.getByText("Hoàn thành")).toBeInTheDocument();
    expect(screen.getByText("Thiết kế database")).toBeInTheDocument();
    expect(screen.getByText("Minh Anh")).toBeInTheDocument();
  });
});

