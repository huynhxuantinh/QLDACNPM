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
});
