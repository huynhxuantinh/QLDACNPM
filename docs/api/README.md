# Backend API P0

## Tài liệu tương tác

- Swagger UI: `http://localhost:8000/api/docs/`
- OpenAPI JSON/YAML: `http://localhost:8000/api/schema/`
- Snapshot trong repository: `openapi.yaml`
- Postman: import `TaskFlow.postman_collection.json`

## Tài khoản seed

Chạy `python manage.py seed_demo` hoặc lệnh tương ứng trong Docker.

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@taskflow.local` | `Demo123!` |
| Project Manager | `manager@taskflow.local` | `Demo123!` |
| Member | `member@taskflow.local` | `Demo123!` |

Chỉ dùng các tài khoản này cho môi trường demo, không dùng production.

## Format lỗi

```json
{
  "code": "permission_denied",
  "message": "Bạn không có quyền thực hiện thao tác này.",
  "details": {}
}
```

Danh sách phân trang dùng `count`, `next`, `previous`, `results`. Thời gian trả về theo ISO 8601; hệ thống lưu UTC.
