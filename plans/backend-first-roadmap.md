# Lộ trình Backend trước, Frontend sau

## 1. Nguyên tắc triển khai

- Hoàn thiện toàn bộ API **P0**, test, tài liệu OpenAPI, staging và dữ liệu seed trước khi viết màn hình nghiệp vụ frontend. Comment, ActivityLog và Notification là P1, không thuộc Backend Gate.
- Frontend chỉ bắt đầu khi Backend Gate ở cuối tuần 6 đạt 100%.
- Không thêm chức năng P1/P2 khi P0 chưa hoàn chỉnh.
- Làm trực tiếp trên nhánh `main` trong giai đoạn hiện tại vì repository chưa có remote; mỗi bước tạo một commit độc lập khi đã kiểm tra đạt.

## 2. Thứ tự phụ thuộc

```text
BE nền tảng
  → Auth + RBAC
  → Project + Member
  → Task + Workflow
  → Dashboard + Backend Gate
  → FE nền tảng + Auth
  → FE Project + Task
  → FE Kanban + Dashboard
  → E2E + Deploy + Bảo vệ
```

## 3. Kế hoạch 10 tuần

| Tuần | Giai đoạn | Kết quả bắt buộc |
|---|---|---|
| 1 | Phân tích | SRS, use case, ERD, backlog, wireframe — đã hoàn thành |
| 2 | BE-01 Nền tảng | Docker, custom User, cấu trúc app, PostgreSQL, OpenAPI, format lỗi, migration đầu tiên |
| 3 | BE-02 Auth và RBAC | Login/refresh/me/đổi mật khẩu, CRUD/khóa user, quyền Admin–PM–Member |
| 4 | BE-03 Dự án | CRUD project, quản lý member, kiểm tra quyền theo project |
| 5 | BE-04 Công việc | CRUD task, assignee, priority, deadline, workflow trạng thái, search/filter/order |
| 6 | BE-05 Dashboard và khóa API | KPI, overdue, seed, API docs, integration test, production config, staging, Backend Gate |
| 7 | FE-01 Nền tảng | Router, API client, auth state, login, protected route, layout responsive |
| 8 | FE-02 Nghiệp vụ | Danh sách/chi tiết dự án, member, task CRUD, form validation, filter |
| 9 | FE-03 Tiến độ | Kanban, đổi trạng thái, dashboard, loading/error/empty state, responsive |
| 10 | Hoàn thiện | E2E, sửa lỗi, production Docker, deploy, báo cáo và diễn tập demo |

## 4. Các bước thi công

### BE-01 — Nền tảng backend và hợp đồng API

**Bối cảnh:** Django REST Framework đã có skeleton và chạy qua Docker Compose. Custom User phải được tạo trước migration nghiệp vụ đầu tiên để tránh thay đổi khó khăn về sau.

**Công việc:**

1. Tạo custom `User` dùng email đăng nhập; enum vai trò `ADMIN`, `PROJECT_MANAGER`, `MEMBER`.
2. Cấu hình `AUTH_USER_MODEL`, SimpleJWT, CORS và biến môi trường.
3. Thêm `drf-spectacular`; viết trước contract OpenAPI P0 gồm pagination, list envelope, filter, mã 400/401/403/404/409, ISO 8601 UTC và format lỗi.
4. Chuẩn hóa response lỗi gồm `code`, `message`, `details`.
5. Cấu hình pytest, factory/fixture nền tảng và CI tối thiểu.
6. Tạo migration và xác nhận PostgreSQL khởi tạo từ database rỗng.

**Kiểm tra:**

```bash
docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py check
docker compose exec backend pytest
```

**Điều kiện thoát:** migration chạy từ đầu; `/api/health/` và `/api/schema/` phản hồi; test nền tảng đạt.

**Hoàn tác:** nếu custom User chưa migrate ổn định, xóa migration phát sinh của giai đoạn phát triển và tạo lại database dev trước khi có dữ liệu thật.

### BE-02 — Xác thực, người dùng và phân quyền

**Bối cảnh:** kế thừa User và chuẩn lỗi từ BE-01; chưa phụ thuộc project/task.

**Công việc:**

1. API login, refresh token, logout/blacklist refresh token, thông tin hiện tại và đổi mật khẩu.
2. Admin tạo, xem, sửa, khóa tài khoản; không trả trường password.
3. Permission classes cho global role và object-level permission.
4. Test 200/400/401/403, token đã thu hồi, tài khoản bị khóa kể cả khi access token cũ còn hạn và mật khẩu yếu.

**Điều kiện thoát:** toàn bộ endpoint auth có trong OpenAPI; logout làm refresh token hết hiệu lực; user bị khóa không dùng API; Member không gọi được API quản trị.

**Hoàn tác:** giữ migration User, revert riêng views/serializers/URLs nếu contract auth cần sửa.

### BE-03 — Dự án và thành viên

**Bối cảnh:** actor đã xác thực và có role. Project Manager chỉ quản lý dự án mình sở hữu.

**Công việc:**

1. Model `Project` có owner/status/ngày/timestamps và `ProjectMember`; constraint duy nhất `(project, user)` và `due_date >= start_date`.
2. CRUD project; dùng `ARCHIVED` thay vì xóa cứng.
3. API thêm/xóa/liệt kê thành viên. Owner không được xóa khỏi project; thành viên còn task chưa hoàn thành phải được giao lại task trước khi xóa, nếu không trả 409.
4. Queryset luôn giới hạn theo quyền; Admin xem tất cả, PM/Member xem dự án tham gia.
5. Test truy cập chéo dự án, trùng thành viên, xóa owner, xóa assignee đang có task và ngày kết thúc sai.

**Nguồn quyền:** `User.role` quyết định quyền toàn cục; `Project.owner` quyết định ai quản lý dự án; `ProjectMember` chỉ biểu diễn tư cách tham gia, không có `project_role` trong P0.

**Điều kiện thoát:** không thể đọc/sửa dự án ngoài phạm vi; owner luôn là thành viên; API và OpenAPI khớp nhau.

**Hoàn tác:** rollback migration project nếu schema sai; không sửa lịch sử migration đã dùng trên staging.

### BE-04 — Công việc và workflow

**Bối cảnh:** task bắt buộc thuộc project và assignee phải là thành viên project.

**Công việc:**

1. Model `Task` với project, reporter, assignee, priority, status, due date, completed date, timestamps và soft delete. Khi user bị khóa/xóa dùng `SET_NULL`; project/task nghiệp vụ không xóa cứng.
2. CRUD task; filter theo project/assignee/status/priority, search tiêu đề và ordering deadline.
3. API đổi trạng thái theo luồng hợp lệ; cập nhật `completed_at` tự động.
4. Chặn giao việc cho người ngoài dự án; Member chỉ sửa trạng thái việc của mình.
5. Tối ưu query bằng `select_related/prefetch_related`; thêm index project, assignee, status, due date và constraint nghiệp vụ cần thiết.

**Điều kiện thoát:** reload không mất trạng thái; ca assignee sai và transition sai bị chặn; test CRUD/filter/permission đạt.

**Hoàn tác:** tách workflow trong service để có thể đổi quy tắc mà không đổi API CRUD.

### BE-05 — Dashboard, seed và Backend Gate

**Bối cảnh:** KPI phải tính từ dữ liệu project/task đã hoàn thiện, theo đúng phạm vi người dùng.

**Công việc:**

1. API tổng task, TODO/IN_PROGRESS/REVIEW/DONE, overdue và tỷ lệ hoàn thành.
2. Seed cố định gồm 3 vai trò, nhiều dự án và task đủ trạng thái.
3. Hoàn thiện Swagger, Postman collection và README endpoint; chạy `spectacular --validate`, lưu schema snapshot và sinh TypeScript types cho frontend.
4. Chạy migration từ database rỗng, integration test và kiểm tra truy vấn.
5. Hoàn thiện Gunicorn, biến môi trường production, static, healthcheck và deploy backend staging.
6. Đóng băng contract P0; thay đổi sau gate phải tương thích ngược hoặc cập nhật version.

**Backend Gate — tất cả phải đạt:**

- `pytest` đạt toàn bộ; bao phủ auth, RBAC, project, member, task và dashboard.
- Các ca bắt buộc đạt: 401, 403, truy cập chéo dự án, assignee ngoài dự án, workflow sai, KPI theo seed.
- Swagger mô tả đủ endpoint, request và response; Postman chạy được từ đầu.
- Migration và seed chạy thành công trên PostgreSQL rỗng.
- Không có lỗi nghiêm trọng; response không lộ password, secret hoặc dữ liệu ngoài quyền.
- Docker healthcheck của backend và database ở trạng thái healthy.
- Ma trận endpoint × role đạt; permissions/services đạt coverage tối thiểu 80% trên PostgreSQL thật.
- Test xác nhận timezone overdue, soft-delete không lọt vào list/KPI, KPI không N+1 và API chính dưới 2 giây với dữ liệu seed.
- Backend staging chạy bằng Gunicorn và cấu hình production; không dùng Django development server.

Nếu gate chưa đạt, tuần 7 tiếp tục sửa backend; chưa chuyển sang frontend nghiệp vụ.

### FE-01 — Nền tảng và xác thực

**Bối cảnh:** sử dụng API contract đã khóa ở BE-05, không dùng dữ liệu giả cho luồng chính.

**Công việc:** router, API client, token handling, login, logout, thông tin người dùng, protected route, layout và menu theo role.

**Điều kiện thoát:** đăng nhập bằng tài khoản seed; refresh/logout hoạt động; route riêng tư bị chặn; lỗi API hiển thị đúng; smoke test login chạy bằng API thật.

**Hoàn tác:** API client tách riêng để có thể thay thư viện UI/state mà không sửa feature.

### FE-02 — Màn hình dự án và công việc

**Bối cảnh:** toàn bộ form và bảng dùng API thật đã khóa.

**Công việc:** danh sách/chi tiết/form dự án, quản lý thành viên, danh sách/chi tiết/form task, search/filter/order, validation và phân quyền nút thao tác.

**Điều kiện thoát:** các luồng CRUD P0 chạy qua UI; lỗi 400/403 được xử lý; dữ liệu giữ nguyên sau reload; smoke test tạo project và task chạy bằng API thật.

**Hoàn tác:** mỗi feature độc lập; có thể tắt route chưa đạt mà không ảnh hưởng auth/layout.

### FE-03 — Kanban và dashboard

**Bối cảnh:** chỉ triển khai sau khi CRUD project/task ổn định.

**Công việc:** Kanban 4 cột, nút đổi trạng thái, KPI dashboard, overdue, responsive 360 px, loading/error/empty states. Kéo-thả chỉ làm khi còn thời gian.

**Điều kiện thoát:** Kanban và KPI khớp API; luồng chính không tràn ngang ở 360 px; không dùng số liệu hard-code; E2E luồng chính chạy đạt.

**Hoàn tác:** nếu drag-and-drop lỗi, giữ nút đổi trạng thái làm phương án P0.

### RELEASE — Tích hợp, triển khai và bảo vệ

**Công việc:** chạy lại toàn bộ E2E, sửa lỗi, production Docker frontend, backup/restore, deploy frontend, tài khoản demo, báo cáo, slide và video dự phòng. Backend production/staging đã hoàn thành ở BE-05.

**Điều kiện thoát:** demo 7–10 phút chạy được cả online và local; E2E đạt; database demo có thể tái tạo.

## 5. Quy tắc thay đổi kế hoạch

- Nếu backend trễ: lùi frontend và bỏ P1/P2, không bỏ test quyền hoặc migration.
- Nếu cần đổi response sau Backend Gate: ghi rõ breaking change, cập nhật OpenAPI và frontend cùng một bước.
- Nếu một bước lớn hơn 1 tuần: tách theo endpoint nhưng giữ nguyên điều kiện thoát.
- Không sửa migration đã chạy trên staging; tạo migration mới để điều chỉnh.
