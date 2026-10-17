export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
import type { ApiErrorBody, DashboardSummary, Paginated, Project, ProjectMember, Task, TaskStatus, User, UserOption } from "../types";

const API_URL = API_BASE_URL.replace(/\/$/, "");
const ACCESS_KEY = "taskflow_access";
const REFRESH_KEY = "taskflow_refresh";

export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody) {
    super(body.message || "Có lỗi xảy ra.");
  }
}

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh?: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

async function parseError(response: Response): Promise<ApiError> {
  const fallback: ApiErrorBody = { code: "request_failed", message: "Không thể xử lý yêu cầu." };
  try {
    return new ApiError(response.status, { ...fallback, ...(await response.json()) });
  } catch {
    return new ApiError(response.status, fallback);
  }
}

async function refreshAccess(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    tokenStore.clear();
    return null;
  }
  const data = await response.json();
  tokenStore.set(data.access, data.refresh);
  return data.access;
}

function resolveRequestUrl(path: string): string {
  if (!/^https?:\/\//i.test(path)) return `${API_URL}${path}`;

  const browserOrigin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const apiBase = new URL(API_URL, browserOrigin);
  const nextUrl = new URL(path);
  const apiPath = apiBase.pathname.replace(/\/$/, "");
  if (nextUrl.origin !== apiBase.origin || !nextUrl.pathname.startsWith(`${apiPath}/`)) {
    throw new Error("API trả về đường dẫn phân trang không hợp lệ.");
  }
  return nextUrl.toString();
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const access = tokenStore.getAccess();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const response = await fetch(resolveRequestUrl(path), { ...init, headers });
  if (response.status === 401 && retry && tokenStore.getRefresh()) {
    const nextAccess = await refreshAccess();
    if (nextAccess) return request<T>(path, init, false);
  }
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return response.json();
}

async function requestAllPages<T>(path: string): Promise<Paginated<T>> {
  const firstPage = await request<Paginated<T>>(path);
  const results = [...firstPage.results];
  const visited = new Set<string>();
  let next = firstPage.next;

  while (next) {
    if (visited.has(next)) throw new Error("API trả về vòng lặp phân trang không hợp lệ.");
    visited.add(next);
    const page = await request<Paginated<T>>(next);
    results.push(...page.results);
    next = page.next;
  }

  return { ...firstPage, next: null, previous: null, results };
}

export const api = {
  login: (email: string, password: string) => request<{ access: string; refresh: string; user: User }>("/auth/login/", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<User>("/auth/me/"),
  logout: (refresh: string) => request<void>("/auth/logout/", { method: "POST", body: JSON.stringify({ refresh }) }),
  dashboard: (project?: number) => request<DashboardSummary>(`/dashboard/summary/${project ? `?project=${project}` : ""}`),
  projects: () => requestAllPages<Project>("/projects/"),
  project: (id: number) => request<Project>(`/projects/${id}/`),
  createProject: (data: Partial<Project>) => request<Project>("/projects/", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Project>) => request<Project>(`/projects/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  archiveProject: (id: number) => request<void>(`/projects/${id}/`, { method: "DELETE" }),
  projectMembers: (id: number) => request<ProjectMember[]>(`/projects/${id}/members/`),
  addProjectMember: (id: number, userId: number) => request<ProjectMember>(`/projects/${id}/members/`, { method: "POST", body: JSON.stringify({ user_id: userId }) }),
  removeProjectMember: (id: number, userId: number) => request<void>(`/projects/${id}/members/${userId}/`, { method: "DELETE" }),
  tasks: (query = "") => requestAllPages<Task>(`/tasks/${query ? `?${query}` : ""}`),
  createTask: (data: Record<string, unknown>) => request<Task>("/tasks/", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: number, data: Record<string, unknown>) => request<Task>(`/tasks/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}/`, { method: "DELETE" }),
  updateTaskStatus: (id: number, status: TaskStatus) => request<Task>(`/tasks/${id}/status/`, { method: "PATCH", body: JSON.stringify({ status }) }),
  users: () => requestAllPages<User>("/users/"),
  userOptions: (search = "") => requestAllPages<UserOption>(`/users/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createUser: (data: Record<string, unknown>) => request<User>("/users/", { method: "POST", body: JSON.stringify(data) }),
};
