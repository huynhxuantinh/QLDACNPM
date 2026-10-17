# Product backlog

Quy ước: P0 bắt buộc, P1 nên có, P2 điểm cộng. Story point dùng dãy 1, 2, 3, 5, 8.

| ID | User story | Ưu tiên | SP | Tuần |
|---|---|---:|---:|---:|
| US-01 | Là người dùng, tôi muốn đăng nhập để truy cập hệ thống | P0 | 5 | 3 |
| US-02 | Là người dùng, tôi muốn đổi mật khẩu | P0 | 3 | 3 |
| US-03 | Là Admin, tôi muốn tạo/sửa/khóa tài khoản | P0 | 5 | 3 |
| US-04 | Là Admin/PM, tôi muốn tạo và cập nhật dự án | P0 | 5 | 4 |
| US-05 | Là Admin/PM, tôi muốn quản lý thành viên dự án | P0 | 5 | 4 |
| US-06 | Là PM, tôi muốn tạo và giao công việc | P0 | 8 | 5 |
| US-07 | Là người dùng, tôi muốn xem chi tiết công việc | P0 | 3 | 5 |
| US-08 | Là assignee, tôi muốn cập nhật trạng thái | P0 | 5 | 6 |
| US-09 | Là thành viên, tôi muốn xem Kanban 4 cột | P0 | 5 | 6 |
| US-10 | Là người dùng, tôi muốn tìm kiếm/lọc công việc | P0 | 5 | 5–6 |
| US-11 | Là người dùng, tôi muốn xem KPI tiến độ | P0 | 8 | 7 |
| US-12 | Là người dùng mobile, tôi muốn dùng luồng chính ở màn hình nhỏ | P0 | 5 | 8 |
| US-13 | Là thành viên, tôi muốn bình luận trong task | P1 | 5 | 6–7 |
| US-14 | Là PM, tôi muốn xem lịch sử thay đổi | P1 | 5 | 6–7 |
| US-15 | Là người dùng, tôi muốn nhận thông báo trong app | P1 | 8 | Sau P0 |
| US-16 | Là người dùng, tôi muốn kéo-thả task trên Kanban | P2 | 5 | Sau P0 |

## Definition of Done

Một user story chỉ được đánh dấu hoàn thành khi:

1. UI, API và database đã tích hợp.
2. Có validation và kiểm tra phân quyền.
3. Có trạng thái loading, empty và error phù hợp.
4. Acceptance scenarios và test liên quan chạy đạt.
5. Tài liệu API/ERD được cập nhật nếu có thay đổi.
