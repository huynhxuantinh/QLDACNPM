import type { Task, TaskStatus, User } from "../types";

export const TASK_COLUMNS: { id: TaskStatus; label: string; hint: string }[] = [
  { id: "TODO", label: "Cần làm", hint: "Đã lên kế hoạch" },
  { id: "IN_PROGRESS", label: "Đang làm", hint: "Đang triển khai" },
  { id: "REVIEW", label: "Chờ duyệt", hint: "Cần kiểm tra" },
  { id: "DONE", label: "Hoàn thành", hint: "Đã kết thúc" },
];

const managerTransitions: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["TODO", "REVIEW"],
  REVIEW: ["IN_PROGRESS", "DONE"],
  DONE: ["REVIEW"],
};

const memberTransitions: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["REVIEW"],
  REVIEW: [],
  DONE: [],
};

export function taskStatusOptions(task: Task, user: User | null, canManage: boolean): TaskStatus[] {
  if (!user) return [task.status];
  const isAssignee = task.assignee?.id === user.id;
  if (!canManage && !isAssignee) return [task.status];

  const hasReviewAuthority = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";
  const transitions = hasReviewAuthority ? managerTransitions : memberTransitions;
  const allowed = new Set<TaskStatus>([task.status, ...transitions[task.status]]);
  return TASK_COLUMNS.map((column) => column.id).filter((status) => allowed.has(status));
}

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

export function tasksNeedingAttention(tasks: Task[], now = new Date()): Task[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 7);

  return tasks
    .filter((task) => task.status !== "DONE" && task.due_date && new Date(task.due_date) <= cutoff)
    .sort((left, right) => new Date(left.due_date!).getTime() - new Date(right.due_date!).getTime());
}

export function formatDueDate(value: string | null): string {
  if (!value) return "Chưa đặt hạn";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
}
