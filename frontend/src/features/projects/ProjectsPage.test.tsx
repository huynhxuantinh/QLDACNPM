import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

import { ProjectsPage } from "./ProjectsPage";

const apiMock = vi.hoisted(() => ({
  projects: vi.fn(),
  createProject: vi.fn(),
}));

vi.mock("../../api", () => ({ api: apiMock }));

describe("ProjectsPage date validation", () => {
  beforeEach(() => {
    apiMock.projects.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    apiMock.createProject.mockReset();
  });

  it("giới hạn ngày bắt đầu và không gửi khoảng ngày không hợp lệ", async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><ProjectsPage /></BrowserRouter>);

    await user.click(screen.getByRole("button", { name: "Tạo dự án" }));
    const startDate = screen.getByLabelText("Ngày bắt đầu");
    const dueDate = screen.getByLabelText("Hạn hoàn thành");

    expect(startDate).toHaveAttribute("min");
    fireEvent.change(startDate, { target: { value: "2099-10-20" } });
    expect(dueDate).toHaveAttribute("min", "2099-10-20");
    fireEvent.change(dueDate, { target: { value: "2099-10-19" } });
    fireEvent.submit(screen.getByRole("button", { name: "Tạo dự án" }).closest("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Hạn hoàn thành không được trước ngày bắt đầu.",
    );
    expect(apiMock.createProject).not.toHaveBeenCalled();
  });
});
