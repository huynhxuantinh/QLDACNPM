import { expect, test } from "@playwright/test";

test("quản lý dự án đăng nhập và mở các màn hình chính", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("manager@taskflow.local");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page.getByRole("heading", { name: /Chào .* hôm nay mình làm gì/ })).toBeVisible();
  await expect(page.getByText("Tổng công việc")).toBeVisible();

  await page.getByRole("link", { name: "Dự án", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dự án của đội ngũ" })).toBeVisible();
  await expect(page.getByText("Website nội bộ")).toBeVisible();

  await page.getByRole("link", { name: "Công việc", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bảng công việc" })).toBeVisible();
  await expect(page.getByText("Thiết kế database")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hoàn thành" })).toBeVisible();

  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/taskflow-board.png", fullPage: true });
});

