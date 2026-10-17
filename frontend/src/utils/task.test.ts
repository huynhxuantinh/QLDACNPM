import { describe, expect, it } from "vitest";

import { formatDueDate, groupTasksByStatus, initials, projectProgress, tasksNeedingAttention } from "./task";
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

  it("chỉ lấy việc chưa hoàn thành đã quá hạn hoặc đến hạn trong 7 ngày", () => {
    const now = new Date("2026-10-17T12:00:00Z");
    const withDueDate = (id: number, status: Task["status"], dueDate: string) => ({
      ...task(id, status),
      title: `Việc ${id}`,
      due_date: dueDate,
    });

    const result = tasksNeedingAttention([
      withDueDate(1, "DONE", "2026-10-12T12:00:00Z"),
      withDueDate(2, "TODO", "2026-10-16T12:00:00Z"),
      withDueDate(3, "IN_PROGRESS", "2026-10-20T12:00:00Z"),
      withDueDate(4, "REVIEW", "2026-10-30T12:00:00Z"),
      task(5, "TODO"),
    ], now);

    expect(result.map((item) => item.id)).toEqual([2, 3]);
  });
});

