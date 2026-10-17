import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

import type { DashboardSummary, Task, User } from "../types";
import { AppShell } from "./AppShell";

const apiMock = vi.hoisted(() => ({ dashboard: vi.fn(), tasks: vi.fn() }));
const logoutMock = vi.hoisted(() => vi.fn());

vi.mock("../api", () => ({ api: apiMock }));
vi.mock("../features/auth", () => ({
  useAuth: () => ({ user: currentUser, logout: logoutMock }),
}));

const currentUser: User = {
  id: 1,
  email: "manager@taskflow.local",
  full_name: "Quản lý Demo",
  role: "PROJECT_MANAGER",
  avatar_url: "",
  is_active: true,
};

const summary: DashboardSummary = {
  total: 10,
  todo: 4,
  in_progress: 2,
  review: 1,
  done: 3,
  overdue: 1,
  completion_rate: 30,
};

function dueDate(offsetDays: number) {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString();
}

function task(id: number, title: string, offsetDays: number, status: Task["status"] = "TODO"): Task {
  return {
    id,
    project: 1,
    title,
    description: "",
    assignee: null,
    reporter: null,
    priority: "HIGH",
    status,
    due_date: dueDate(offsetDays),
    completed_at: null,
    created_at: dueDate(-10),
    updated_at: dueDate(-1),
  };
}

function renderShell() {
  return render(<BrowserRouter><AppShell><p>Nội dung</p></AppShell></BrowserRouter>);
}

describe("AppShell live data", () => {
  beforeEach(() => {
    apiMock.dashboard.mockResolvedValue(summary);
    apiMock.tasks.mockResolvedValue({
      count: 3,
      next: null,
      previous: null,
      results: [
        task(1, "Việc đã quá hạn", -1),
        task(2, "Việc sắp đến hạn", 2),
        task(3, "Việc đã xong", -2, "DONE"),
      ],
    });
  });

  it("hiển thị tiến độ thật thay cho mục tiêu hard-code", async () => {
    renderShell();

    expect(await screen.findByText("3/10 công việc đã hoàn thành")).toBeInTheDocument();
    expect(screen.queryByText("7/10 mục tiêu đã đạt")).not.toBeInTheDocument();
  });

  it("mở danh sách thông báo từ công việc cần chú ý", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(await screen.findByRole("button", { name: /Thông báo/ }));

    expect(screen.getByRole("heading", { name: "Thông báo công việc" })).toBeInTheDocument();
    expect(screen.getByText("Việc đã quá hạn")).toBeInTheDocument();
    expect(screen.getByText("Việc sắp đến hạn")).toBeInTheDocument();
    expect(screen.queryByText("Việc đã xong")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tất cả công việc" })).toHaveAttribute("href", "/tasks");
  });
});
