import { afterEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL, api, tokenStore } from "./index";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const resources = [
  { name: "tasks", path: "tasks", load: () => api.tasks() },
  { name: "projects", path: "projects", load: () => api.projects() },
  { name: "users", path: "users", load: () => api.users() },
];

describe("paginated API collections", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it.each(resources)("tải đủ mọi trang của $name", async ({ path, load }) => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }));
    const secondPage = Array.from({ length: 5 }, (_, index) => ({ id: index + 21 }));
    const next = `${API_BASE_URL}/${path}/?page=2`;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ count: 25, next, previous: null, results: firstPage }))
      .mockResolvedValueOnce(jsonResponse({ count: 25, next: null, previous: `${API_BASE_URL}/${path}/`, results: secondPage }));
    vi.stubGlobal("fetch", fetchMock);

    const page = await load();

    expect(page.count).toBe(25);
    expect(page.results).toHaveLength(25);
    expect(page.results.at(-1)).toMatchObject({ id: 25 });
    expect(page.next).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("không gửi token tới đường dẫn phân trang ngoài API", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({
      count: 25,
      next: "https://example.com/steal-token?page=2",
      previous: null,
      results: Array.from({ length: 20 }, (_, index) => ({ id: index + 1 })),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.tasks()).rejects.toThrow("đường dẫn phân trang không hợp lệ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("phát hiện vòng lặp phân trang", async () => {
    const next = `${API_BASE_URL}/tasks/?page=2`;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ count: 21, next, previous: null, results: Array.from({ length: 20 }, (_, index) => ({ id: index + 1 })) }))
      .mockResolvedValueOnce(jsonResponse({ count: 21, next, previous: `${API_BASE_URL}/tasks/`, results: [{ id: 21 }] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.tasks()).rejects.toThrow("vòng lặp phân trang không hợp lệ");
  });
});

describe("API request contracts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("lưu và xóa JWT", () => {
    tokenStore.set("access-token", "refresh-token");
    expect(tokenStore.getAccess()).toBe("access-token");
    expect(tokenStore.getRefresh()).toBe("refresh-token");

    tokenStore.clear();
    expect(tokenStore.getAccess()).toBeNull();
    expect(tokenStore.getRefresh()).toBeNull();
  });

  const requests = [
    { name: "login", path: "/auth/login/", method: "POST", call: () => api.login("demo@example.com", "secret") },
    { name: "me", path: "/auth/me/", method: "GET", call: () => api.me() },
    { name: "logout", path: "/auth/logout/", method: "POST", call: () => api.logout("refresh") },
    { name: "dashboard", path: "/dashboard/summary/", method: "GET", call: () => api.dashboard() },
    { name: "dashboard project", path: "/dashboard/summary/?project=3", method: "GET", call: () => api.dashboard(3) },
    { name: "project detail", path: "/projects/3/", method: "GET", call: () => api.project(3) },
    { name: "create project", path: "/projects/", method: "POST", call: () => api.createProject({ name: "A" }) },
    { name: "update project", path: "/projects/3/", method: "PATCH", call: () => api.updateProject(3, { name: "B" }) },
    { name: "archive project", path: "/projects/3/", method: "DELETE", call: () => api.archiveProject(3) },
    { name: "project members", path: "/projects/3/members/", method: "GET", call: () => api.projectMembers(3) },
    { name: "add project member", path: "/projects/3/members/", method: "POST", call: () => api.addProjectMember(3, 7) },
    { name: "remove project member", path: "/projects/3/members/7/", method: "DELETE", call: () => api.removeProjectMember(3, 7) },
    { name: "create task", path: "/tasks/", method: "POST", call: () => api.createTask({ title: "A" }) },
    { name: "update task", path: "/tasks/4/", method: "PATCH", call: () => api.updateTask(4, { title: "B" }) },
    { name: "delete task", path: "/tasks/4/", method: "DELETE", call: () => api.deleteTask(4) },
    { name: "update task status", path: "/tasks/4/status/", method: "PATCH", call: () => api.updateTaskStatus(4, "DONE") },
    { name: "create user", path: "/users/", method: "POST", call: () => api.createUser({ email: "new@example.com" }) },
  ];

  it.each(requests)("gửi đúng contract $name", async ({ path, method, call }) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await call();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}${path}`);
    expect(init.method ?? "GET").toBe(method);
  });

  it("làm mới access token rồi thử lại request bị 401", async () => {
    tokenStore.set("old-access", "refresh-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: "Hết hạn" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access: "new-access", refresh: "new-refresh" }))
      .mockResolvedValueOnce(jsonResponse({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.me()).resolves.toMatchObject({ id: 1 });
    expect(tokenStore.getAccess()).toBe("new-access");
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe("Bearer new-access");
  });

  it("trả lỗi chuẩn và xóa token khi refresh thất bại", async () => {
    tokenStore.set("old-access", "bad-refresh");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ code: "unauthorized", message: "Phiên đăng nhập hết hạn" }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: "Refresh không hợp lệ" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.me()).rejects.toMatchObject({ status: 401, message: "Phiên đăng nhập hết hạn" });
    expect(tokenStore.getAccess()).toBeNull();
  });

  it("dùng thông báo dự phòng khi lỗi không có JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("Lỗi máy chủ", { status: 500 })));

    await expect(api.me()).rejects.toMatchObject({
      status: 500,
      message: "Không thể xử lý yêu cầu.",
    });
  });

  it("xử lý response 204 không có body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })));

    await expect(api.logout("refresh")).resolves.toBeUndefined();
  });
});
