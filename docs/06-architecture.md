# Kiến trúc và cấu trúc dự án

## 1. Kiến trúc

```text
React + TypeScript
        │ HTTPS / JSON / JWT
        ▼
Django REST Framework
        │ Django ORM
        ▼
PostgreSQL
```

Ba thành phần chạy trong ba container riêng và được điều phối bằng Docker Compose. PostgreSQL chỉ nằm trong mạng backend và lưu dữ liệu bằng named volume.

- Frontend chịu trách nhiệm giao diện, route, form và gọi API.
- Backend xử lý nghiệp vụ, validation, phân quyền và thống kê.
- PostgreSQL là nguồn dữ liệu duy nhất; dashboard không dùng số liệu hard-code.

## 2. Cấu trúc repository dự kiến

```text
QLDACNPM/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   └── tasks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   └── tests/
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── dashboard/
│   │   └── notifications/
│   ├── tests/
│   └── manage.py
├── docs/
├── plans/
├── .env.example
├── compose.yaml
├── .gitignore
└── README.md
```

## 3. API P0 dự kiến

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/auth/login/` | Đăng nhập |
| POST | `/api/auth/refresh/` | Làm mới access token |
| POST | `/api/auth/logout/` | Thu hồi refresh token |
| GET | `/api/auth/me/` | Lấy người dùng hiện tại |
| POST | `/api/auth/change-password/` | Đổi mật khẩu |
| GET/POST | `/api/users/` | Danh sách/tạo tài khoản |
| PATCH | `/api/users/{id}/` | Sửa hoặc khóa tài khoản |
| GET/POST | `/api/projects/` | Danh sách/tạo dự án |
| GET/PATCH/DELETE | `/api/projects/{id}/` | Chi tiết/sửa/đóng dự án |
| GET/POST | `/api/projects/{id}/members/` | Xem/thêm thành viên |
| DELETE | `/api/projects/{id}/members/{userId}/` | Xóa thành viên |
| GET/POST | `/api/tasks/` | Lọc/tạo công việc |
| GET/PATCH/DELETE | `/api/tasks/{id}/` | Chi tiết/sửa/xóa mềm task |
| PATCH | `/api/tasks/{id}/status/` | Đổi trạng thái |
| GET | `/api/dashboard/summary/` | Lấy KPI theo quyền/bộ lọc |

## 4. Nguyên tắc triển khai

- Frontend không tự quyết định quyền; backend luôn kiểm tra lại.
- Không commit `.env`, token hoặc mật khẩu.
- Migration và seed phải chạy được trên máy mới.
- Mỗi app Django tách `models`, `serializers`, `permissions`, `services`, `views`, `urls`, `tests`.
- API lỗi dùng cấu trúc thống nhất: `code`, `message`, `details`.
- Môi trường phát triển khởi động bằng `docker compose up --build`; không cài Node, Python hoặc PostgreSQL trực tiếp vào máy để chạy dự án.
