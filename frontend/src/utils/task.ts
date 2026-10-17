import type { Task, TaskStatus } from "../types";

export const TASK_COLUMNS: { id: TaskStatus; label: string; hint: string }[] = [
  { id: "TODO", label: "Cần làm", hint: "Đã lên kế hoạch" },
  { id: "IN_PROGRESS", label: "Đang làm", hint: "Đang triển khai" },
  { id: "REVIEW", label: "Chờ duyệt", hint: "Cần kiểm tra" },
  { id: "DONE", label: "Hoàn thành", hint: "Đã kết thúc" },
];

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return tasks.reduce<Record<TaskStatus, Task[]>>((groups, task) => {
    groups[task.status].push(task);
    return groups;
  }, { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] });
}

export function projectProgress(tasks: Task[]): number {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100);
}

export function formatDueDate(value: string | null): string {
  if (!value) return "Chưa đặt hạn";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
}
