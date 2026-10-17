import { describe, expect, it } from "vitest";

import { formatDueDate, groupTasksByStatus, initials, projectProgress } from "./task";
import type { Task } from "../types";

const task = (id: number, status: Task["status"]): Task => ({
  id,
  project: 1,
  title: `Công việc ${id}`,
  description: "",
  assignee: null,
  reporter: null,
  priority: "MEDIUM",
  status,
  due_date: null,
  completed_at: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
});

describe("task utilities", () => {
  it("groups tasks into all workflow columns", () => {
    const grouped = groupTasksByStatus([
      task(1, "TODO"),
      task(2, "IN_PROGRESS"),
      task(3, "DONE"),
    ]);

    expect(grouped.TODO).toHaveLength(1);
    expect(grouped.IN_PROGRESS).toHaveLength(1);
    expect(grouped.REVIEW).toEqual([]);
    expect(grouped.DONE).toHaveLength(1);
  });

  it("calculates rounded completion percentage", () => {
    expect(projectProgress([task(1, "DONE"), task(2, "TODO"), task(3, "DONE")])).toBe(67);
    expect(projectProgress([])).toBe(0);
  });

  it("renders an empty due date safely", () => {
    expect(formatDueDate(null)).toBe("Chưa đặt hạn");
    expect(formatDueDate("2026-10-20T00:00:00Z")).toContain("2026");
    expect(initials("Nguyễn Minh Anh")).toBe("MA");
  });
});

