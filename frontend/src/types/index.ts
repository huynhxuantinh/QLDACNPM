export {};
export type Role = "ADMIN" | "PROJECT_MANAGER" | "MEMBER";
export type ProjectStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string;
  is_active: boolean;
  date_joined?: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  owner: User;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  user: User;
  joined_at: string;
}

export interface Task {
  id: number;
  project: number;
  title: string;
  description: string;
  assignee: User | null;
  reporter: User | null;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  overdue: number;
  completion_rate: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string[] | string>;
}
