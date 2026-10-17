import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

import { DashboardPage } from "./DashboardPage";

const apiMock = vi.hoisted(() => ({ dashboard: vi.fn(), projects: vi.fn(), tasks: vi.fn() }));

vi.mock("../../api", () => ({ api: apiMock }));
vi.mock("../auth", () => ({
  useAuth: () => ({ user: { full_name: "Quản lý Demo" } }),
}));

describe("DashboardPage live metrics", () => {
  beforeEach(() => {
    apiMock.dashboard.mockResolvedValue({ total: 10, todo: 4, in_progress: 2, review: 1, done: 3, overdue: 1, completion_rate: 30 });
    apiMock.projects.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    apiMock.tasks.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  });

  it("hiển thị số hoàn thành thật thay cho phần trăm tăng trưởng giả", async () => {
    render(<BrowserRouter><DashboardPage /></BrowserRouter>);

    expect(await screen.findByText("3/10 công việc")).toBeInTheDocument();
    expect(screen.queryByText("+12% tháng này")).not.toBeInTheDocument();
  });

  it("chỉ hiển thị deadline cần chú ý và tính tiến độ dự án từ task thật", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const owner = { id: 1, email: "manager@taskflow.local", full_name: "Quản lý Demo", role: "PROJECT_MANAGER", avatar_url: "", is_active: true };
    apiMock.projects.mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, name: "Dự án thật", description: "", status: "ACTIVE", start_date: null, due_date: null, owner, created_at: tomorrow.toISOString(), updated_at: tomorrow.toISOString() }],
    });
    apiMock.tasks.mockResolvedValueOnce({
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 1, project: 1, title: "Deadline thật", description: "", assignee: owner, reporter: owner, priority: "HIGH", status: "TODO", due_date: tomorrow.toISOString(), completed_at: null, created_at: tomorrow.toISOString(), updated_at: tomorrow.toISOString() },
        { id: 2, project: 1, title: "Việc hoàn thành", description: "", assignee: null, reporter: owner, priority: "LOW", status: "DONE", due_date: tomorrow.toISOString(), completed_at: tomorrow.toISOString(), created_at: tomorrow.toISOString(), updated_at: tomorrow.toISOString() },
      ],
    });

    render(<BrowserRouter><DashboardPage /></BrowserRouter>);

    expect(await screen.findByText("Deadline thật")).toBeInTheDocument();
    expect(screen.queryByText("Việc hoàn thành")).not.toBeInTheDocument();
    expect(screen.getByText("Dự án thật")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
