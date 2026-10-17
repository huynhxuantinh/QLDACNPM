# Wireframe mức thấp

## 1. Đăng nhập

```text
┌────────────────────────────────────────────┐
│ TASKFLOW                                   │
│ Quản lý công việc nội bộ                   │
│                                            │
│ Email       [________________________]     │
│ Mật khẩu    [________________________]     │
│              [      ĐĂNG NHẬP       ]     │
└────────────────────────────────────────────┘
```

## 2. Dashboard

```text
┌────────────┬────────────────────────────────────────────────┐
│ Logo       │ Tìm kiếm...            Chuông   Tài khoản      │
│ Tổng quan  ├────────────────────────────────────────────────┤
│ Dự án      │ [Tổng việc] [Đang làm] [Hoàn thành] [Trễ hạn] │
│ Công việc  │                                                │
│ Thành viên │ Tiến độ dự án          Công việc sắp đến hạn   │
│            │ [███████░░] 72%        • Task A — 18/10       │
│            │ [████░░░░░] 43%        • Task B — 20/10       │
└────────────┴────────────────────────────────────────────────┘
```

## 3. Kanban

```text
┌──────────────────────────────────────────────────────────────┐
│ Dự án Website         [Tìm kiếm] [Người] [Ưu tiên] [+ Task]│
├──────────────┬──────────────┬──────────────┬────────────────┤
│ CẦN LÀM (3) │ ĐANG LÀM (2)│ CHỜ DUYỆT(1)│ HOÀN THÀNH (5) │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌────────────┐ │
│ │ Task A   │ │ │ Task B   │ │ │ Task C   │ │ │ Task D     │ │
│ │ Cao 20/10│ │ │ TB 21/10 │ │ │ Cao 22/10│ │ │ Thấp 15/10│ │
│ │   [Avatar]│ │ │  [Avatar]│ │ │  [Avatar]│ │ │    [Avatar]│ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └────────────┘ │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

## 4. Chi tiết công việc

```text
┌────────────────────────────────────────────┐
│ TASK-012  Thiết kế màn hình đăng nhập  [X]│
│ Trạng thái [Đang làm v]  Ưu tiên [Cao v] │
│ Người làm  [Nguyễn An v] Hạn [20/10/2026]│
│                                            │
│ Mô tả                                      │
│ [______________________________________]   │
│                                            │
│ Bình luận / Lịch sử (P1)                  │
│                         [Hủy] [Lưu thay đổi]│
└────────────────────────────────────────────┘
```

## 5. Responsive mobile

- Sidebar chuyển thành menu trượt.
- KPI hiển thị lưới 2 cột.
- Kanban cuộn ngang theo từng cột hoặc chuyển sang danh sách theo trạng thái.
- Form chi tiết mở toàn màn hình; nút lưu cố định ở cạnh dưới.
