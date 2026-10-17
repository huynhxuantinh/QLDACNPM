import { afterEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL, api } from "./index";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
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
});
