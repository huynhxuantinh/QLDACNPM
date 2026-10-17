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
});

