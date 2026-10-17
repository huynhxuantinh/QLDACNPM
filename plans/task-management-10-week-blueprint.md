# Kế hoạch 10 tuần — Hệ thống quản lý công việc nội bộ

## 1. Mục tiêu

Xây dựng một web responsive giúp nhóm nội bộ tạo dự án, giao việc, theo dõi tiến độ và nhận biết công việc trễ hạn. Sản phẩm phải có dữ liệu thật, phân quyền cơ bản, kiểm thử và bản triển khai online để bảo vệ đồ án.

## 2. Phạm vi MVP

### Vai trò

- Quản trị viên: quản lý người dùng và xem toàn bộ dự án.
- Quản lý dự án: tạo dự án, thêm thành viên, giao việc, theo dõi tiến độ.
- Thành viên: xem việc được giao, cập nhật trạng thái, bình luận.

### P0 — Bắt buộc để bảo vệ

1. Đăng nhập, đăng xuất và phân quyền theo vai trò.
2. Quản lý người dùng/thành viên.
3. CRUD dự án; thêm thành viên vào dự án.
4. CRUD công việc với người phụ trách, ưu tiên, hạn hoàn thành và trạng thái.
5. Bảng Kanban với 4 trạng thái; tối thiểu có nút đổi trạng thái.
6. Dashboard KPI đơn giản: tổng số việc, tỷ lệ hoàn thành, việc trễ hạn.
7. Tìm kiếm, lọc và sắp xếp công việc.
8. Responsive cho các luồng chính và có bản triển khai online.

### P1 — Làm khi P0 đã ổn định

- Bình luận và lịch sử thay đổi công việc.
- Thông báo trong ứng dụng.
- Tiến độ theo thành viên.

### P2 — Điểm cộng

- Kéo-thả Kanban.
- Biểu đồ nâng cao, file đính kèm hoặc xuất báo cáo.

### Không làm trong MVP

- Ứng dụng mobile native.
- Chat thời gian thực, gọi video.
- AI tự động chia việc.
- Chấm công, tính lương, quản lý tài liệu đầy đủ.
- Tích hợp email/Slack phức tạp.

### Ma trận quyền

| Hành động | Admin | Quản lý dự án | Thành viên |
|---|---:|---:|---:|
| Quản lý tài khoản | Có | Không | Không |
| Tạo dự án | Có | Có | Không |
| Sửa/xóa dự án | Mọi dự án | Dự án mình quản lý | Không |
| Quản lý thành viên dự án | Có | Dự án mình quản lý | Không |
| Tạo/giao việc | Có | Dự án mình quản lý | Không |
| Cập nhật trạng thái | Có | Có trong dự án | Việc được giao |
| Xem dữ liệu | Mọi dự án | Dự án tham gia | Dự án tham gia |

Admin tạo tài khoản và mật khẩu ban đầu; người dùng được đổi mật khẩu. MVP dùng access token thời hạn ngắn và đăng xuất phía client, chưa làm blacklist refresh token.

## 3. Công nghệ đề xuất

- Frontend: React + TypeScript + Vite.
- Backend: Python + Django REST Framework.
- Cơ sở dữ liệu: PostgreSQL.
- Xác thực: JWT; mật khẩu dùng cơ chế băm mặc định của Django.
- UI: Tailwind CSS.
- Kiểm thử: Vitest/React Testing Library cho frontend; Pytest cho API.
- Triển khai: frontend và API trên dịch vụ cloud; PostgreSQL managed.
- Môi trường phát triển: Docker Compose gồm frontend, backend và PostgreSQL; dữ liệu DB lưu trong named volume.

Lý do chọn web: phù hợp nghiệp vụ nội bộ, dùng được trên mọi máy, dễ demo bằng đường link và khối lượng vừa sức trong 10 tuần. Có thể nâng thành PWA sau khi MVP ổn định.

## 4. Mô hình dữ liệu tối thiểu

- `users`: id, name, email, password_hash, role, avatar, status.
- `projects`: id, name, description, start_date, due_date, status, owner_id.
- `project_members`: project_id, user_id, joined_at. Quyền quản lý dự án lấy từ `projects.owner_id`.
- `tasks`: id, project_id, title, description, assignee_id, reporter_id, priority, status, start_date, due_date, completed_at.
- `comments`: id, task_id, user_id, content, created_at.
- `activity_logs`: id, actor_id, entity_type, entity_id, action, metadata, created_at.
- `notifications`: id, user_id, type, content, is_read, created_at.

Mọi bảng nghiệp vụ có `created_at`, `updated_at`; email là duy nhất; thành viên là duy nhất theo `(project_id, user_id)`. Khóa ngoại, cascade và index cho project, assignee, status, due date phải được định nghĩa. API không cho giao việc cho người ngoài dự án.

### Quy tắc nghiệp vụ

- Trễ hạn khi `due_date < thời điểm hiện tại` và trạng thái khác `DONE`.
- Tỷ lệ hoàn thành = số task `DONE` / tổng task chưa bị xóa.
- `completed_at` được gán khi chuyển sang `DONE` và xóa khi mở lại.
- Thời gian lưu UTC, hiển thị theo `Asia/Ho_Chi_Minh`.
- Chốt danh sách trạng thái và chuyển trạng thái hợp lệ ngay trong tuần 1.

## 5. Chỉ tiêu nghiệm thu

- Hoàn thành 100% P0; P1/P2 không được làm ảnh hưởng P0.
- Có đủ 3 vai trò và kiểm tra quyền ở phía API.
- Các API chính có validation, xử lý lỗi và tài liệu endpoint.
- Dashboard tính từ dữ liệu trong database, không dùng số giả.
- Kanban cập nhật trạng thái chính xác; tải lại trang không mất dữ liệu.
- Luồng chính không tràn ngang và thao tác được ở màn hình 360 px và desktop.
- Có API integration test cho auth/RBAC/project/task/dashboard, unit test công thức KPI và ít nhất 1 E2E luồng chính.
- Các ca bắt buộc đạt: 401/403; chặn truy cập chéo dự án; chặn assignee ngoài dự án; lưu trạng thái sau reload; dashboard khớp bộ seed cố định.
- Không có lỗi làm mất dữ liệu, lộ dữ liệu khác dự án, chặn đăng nhập hoặc chặn luồng demo chính.
- Có dữ liệu demo, tài khoản demo, README cài đặt và bản chạy online.
- Hồ sơ đồ án gồm: yêu cầu, use case, ERD, kiến trúc, kiểm thử, hướng dẫn sử dụng và slide demo.

## 6. Lịch triển khai 10 tuần

| Tuần | Trọng tâm | Sản phẩm bàn giao | Điều kiện hoàn thành |
|---|---|---|---|
| 1 | Phân tích và chốt phạm vi | SRS rút gọn, actor/use case, backlog, wireframe, ERD nháp | Chốt chức năng MVP và tiêu chí nghiệm thu |
| 2 | Backend nền tảng | Docker, custom User, PostgreSQL, OpenAPI, migration, CI | Backend chạy từ DB rỗng; health/schema/test đạt |
| 3 | Backend auth/RBAC | JWT, đổi mật khẩu, CRUD/khóa user, phân quyền | API chặn đúng 401/403 và tài khoản bị khóa |
| 4 | Backend dự án | CRUD dự án và quản lý thành viên | Chặn truy cập chéo dự án; constraint đúng |
| 5 | Backend công việc | CRUD task, workflow, deadline, lọc/tìm kiếm | Task và quyền cập nhật đúng; test đạt |
| 6 | Backend dashboard và gate | KPI, overdue, seed, Swagger/Postman, integration test, staging | Backend Gate đạt 100%, backend staging chạy production config, khóa API P0 |
| 7 | Frontend nền tảng | API client, auth, protected route, layout | Đăng nhập bằng API thật và xử lý lỗi đúng |
| 8 | Frontend nghiệp vụ | Dự án, thành viên, task CRUD, lọc | Luồng CRUD P0 chạy qua UI |
| 9 | Frontend tiến độ | Kanban, dashboard, responsive | KPI khớp API; dùng tốt ở 360 px và desktop |
| 10 | Hồ sơ và bảo vệ | Báo cáo, sơ đồ, hướng dẫn, slide, video/kịch bản demo | Demo 7–10 phút chạy trơn tru, có phương án dự phòng |

## 7. Thứ tự phụ thuộc

`Yêu cầu → dữ liệu/kiến trúc → xác thực → dự án → công việc → Kanban/cộng tác → dashboard → kiểm thử/deploy → hồ sơ`

Thiết kế UI, cập nhật ERD/tài liệu, test từng chức năng và deploy thử được thực hiện song song từ tuần 2; không dồn sang tuần cuối.

## 8. Quy tắc kiểm soát tiến độ

- Mỗi tuần có một bản chạy được và một buổi review.
- Mỗi chức năng chỉ được tính hoàn thành khi có UI, API, DB, validation và 2–4 acceptance scenarios đạt.
- Nếu chậm hơn kế hoạch trên 1 tuần: bỏ tính năng mở rộng, không cắt xác thực, phân quyền, test hoặc triển khai.
- Dành tối thiểu 20% tổng thời gian cho kiểm thử, tài liệu và sửa lỗi.
- Không đổi stack sau tuần 2 trừ khi có lỗi chặn nghiêm trọng.

## 9. Phương án hoàn tác/rủi ro

- Kéo-thả quá khó: giữ nút đổi trạng thái; drag-and-drop là phần nâng cao.
- Biểu đồ phức tạp: ưu tiên KPI và progress bar, sau đó mới thêm chart.
- Deploy backend lỗi: chuẩn bị Dockerfile và video demo cục bộ.
- Thiếu thời gian: bỏ file đính kèm và thông báo realtime trước; giữ thông báo trong app.
- Cloud miễn phí sleep/quota: có bản chạy local, seed tái tạo và video demo dự phòng.
- CORS/env/secrets hoặc mất dữ liệu: kiểm tra staging sớm, không commit secret và backup DB trước buổi bảo vệ.
- Thành viên trễ tiến độ: review hằng tuần, task có một người chịu trách nhiệm và deadline rõ ràng.

## 10. Phân công theo quy mô nhóm

- 1 người: chỉ cam kết P0; Kanban dùng nút đổi trạng thái trước.
- 2 người: một người frontend, một người backend/database; chia đều test và tài liệu.
- 3 người: frontend; backend/database; QA/tài liệu/deploy. Mọi người vẫn review chéo code.

## 11. Mở rộng nếu hoàn thành sớm

- File đính kèm.
- Email nhắc hạn.
- PWA và push notification.
- Sprint, milestone hoặc Gantt chart.
- Xuất báo cáo CSV/PDF.
