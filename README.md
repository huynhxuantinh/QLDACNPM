# TaskFlow — Quản lý công việc nội bộ

Web quản lý dự án, giao việc và theo dõi tiến độ, xây dựng bằng React, Django REST Framework và PostgreSQL.

## Chạy bằng Docker

Yêu cầu: Docker Desktop đang hoạt động.

```bash
docker compose up --build
```

Sau khi các service healthy:

- Frontend: http://localhost:5173
- Backend healthcheck: http://localhost:8000/api/health/
- Django Admin: http://localhost:8000/admin/

Dừng hệ thống:

```bash
docker compose down
```

Không dùng `docker compose down -v` nếu muốn giữ dữ liệu PostgreSQL.

Tạo dữ liệu demo:

```bash
docker compose exec backend python manage.py seed_demo
```

## Chạy cấu hình production local

Sao chép `.env.production.example` thành `.env.production`, đổi toàn bộ secret, sau đó chạy:

```bash
docker compose --env-file .env.production -f compose.production.yaml up --build -d
```

Frontend production chạy tại http://localhost:8080. Cấu hình này dùng Gunicorn, security headers, container non-root, filesystem chỉ đọc và PostgreSQL volume riêng.

## Tài liệu

Xem [bộ tài liệu tuần 1](./docs/README.md) và [kế hoạch 10 tuần](./plans/task-management-10-week-blueprint.md).
