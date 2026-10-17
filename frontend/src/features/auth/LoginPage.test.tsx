import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("submits valid credentials", async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage onLogin={onLogin} />);

    await user.type(screen.getByLabelText("Email"), "manager@taskflow.local");
    await user.type(screen.getByLabelText("Mật khẩu"), "Demo123!");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(onLogin).toHaveBeenCalledWith("manager@taskflow.local", "Demo123!");
  });

  it("offers demo credentials", () => {
    render(<LoginPage onLogin={vi.fn()} />);

    expect(screen.getByText("manager@taskflow.local")).toBeInTheDocument();
  });

  it("fills demo credentials and reports login errors", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockRejectedValue(new Error("Sai thông tin đăng nhập"));
    render(<LoginPage onLogin={onLogin} />);

    await user.click(screen.getByRole("button", { name: /Tài khoản demo/i }));
    expect(screen.getByLabelText("Email")).toHaveValue("manager@taskflow.local");
    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sai thông tin đăng nhập");
  });
});

