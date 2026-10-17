# Đặc tả yêu cầu phần mềm (SRS)

## 1. Tổng quan

Hệ thống hỗ trợ tổ chức nội bộ quản lý dự án, giao việc và theo dõi tiến độ tập trung. Người dùng truy cập qua trình duyệt trên máy tính hoặc điện thoại.

## 2. Tác nhân

- **Admin:** quản lý tài khoản, xem và quản trị toàn bộ hệ thống.
- **Project Manager (PM):** tạo dự án, quản lý thành viên và công việc thuộc dự án mình phụ trách.
- **Member:** xem dự án tham gia và cập nhật công việc được giao.

## 3. Yêu cầu chức năng P0

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-01 | Đăng nhập, đăng xuất, đổi mật khẩu | Bắt buộc |
| FR-02 | Admin tạo, sửa, khóa tài khoản | Bắt buộc |
| FR-03 | Phân quyền Admin, PM, Member tại API | Bắt buộc |
| FR-04 | Admin/PM tạo, sửa, đóng và xem dự án đúng phạm vi | Bắt buộc |
| FR-05 | Admin/PM thêm hoặc xóa thành viên dự án | Bắt buộc |
| FR-06 | Admin/PM tạo, sửa, giao và xóa mềm công việc | Bắt buộc |
| FR-07 | Người có quyền cập nhật trạng thái công việc | Bắt buộc |
| FR-08 | Hiển thị công việc dạng danh sách và Kanban 4 cột | Bắt buộc |
| FR-09 | Tìm kiếm; lọc theo dự án, người phụ trách, trạng thái, ưu tiên | Bắt buộc |
| FR-10 | Dashboard hiển thị tổng việc, hoàn thành, đang làm và trễ hạn | Bắt buộc |
| FR-11 | Giao diện responsive ở mobile và desktop | Bắt buộc |

## 4. Yêu cầu P1/P2

- P1: bình luận, activity log, thông báo trong ứng dụng, thống kê theo thành viên.
- P2: kéo-thả Kanban, biểu đồ nâng cao, file đính kèm, xuất CSV/PDF.

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu đo được |
|---|---|
| NFR-01 | API thông thường phản hồi dưới 2 giây với bộ dữ liệu demo |
| NFR-02 | Mật khẩu không lưu dạng rõ; API riêng tư yêu cầu JWT hợp lệ |
| NFR-03 | Người dùng không đọc/sửa dữ liệu ngoài phạm vi quyền |
| NFR-04 | Giao diện không tràn ngang và thao tác được từ độ rộng 360 px |
| NFR-05 | Validation hiển thị lỗi rõ ràng; lỗi server không làm mất dữ liệu đã lưu |
| NFR-06 | Database có seed demo và có thể tái tạo bằng migration |
| NFR-07 | Thời gian lưu UTC, hiển thị theo Asia/Ho_Chi_Minh |

## 6. Quy tắc nghiệp vụ

- Trạng thái công việc: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- Luồng hợp lệ: `TODO → IN_PROGRESS → REVIEW → DONE`; PM/Admin được mở lại về trạng thái trước.
- Công việc trễ hạn khi `due_date < now` và trạng thái khác `DONE`.
- Tỷ lệ hoàn thành = số công việc `DONE` / tổng công việc chưa xóa mềm.
- Chỉ được giao việc cho thành viên thuộc dự án.
- Member chỉ cập nhật trạng thái công việc được giao cho mình.
- Khi chuyển sang `DONE`, hệ thống gán `completed_at`; khi mở lại thì xóa giá trị này.

## 7. Tiêu chí hoàn thành sản phẩm

1. Luồng `đăng nhập → tạo dự án → thêm thành viên → giao việc → cập nhật trạng thái → xem dashboard` chạy thành công.
2. Các ca 401, 403, truy cập chéo dự án và giao việc sai thành viên đều bị chặn.
3. Trạng thái còn nguyên sau khi tải lại trang; KPI khớp dữ liệu seed.
4. Có URL demo, tài khoản demo, hướng dẫn cài đặt và bản chạy local dự phòng.
