# ERD và từ điển dữ liệu

## 1. Sơ đồ ERD

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ PROJECT_MEMBER : joins
    PROJECT ||--o{ PROJECT_MEMBER : contains
    PROJECT ||--o{ TASK : contains
    USER ||--o{ TASK : assigned_to
    USER ||--o{ TASK : reports
    TASK ||--o{ COMMENT : has
    USER ||--o{ COMMENT : writes
    USER ||--o{ ACTIVITY_LOG : performs
    USER ||--o{ NOTIFICATION : receives

    USER {
      bigint id PK
      string email UK
      string password
      string full_name
      string role
      string avatar_url
      boolean is_active
      datetime created_at
      datetime updated_at
    }
    PROJECT {
      bigint id PK
      bigint owner_id FK
      string name
      text description
      string status
      date start_date
      date due_date
      datetime created_at
      datetime updated_at
    }
    PROJECT_MEMBER {
      bigint id PK
      bigint project_id FK
      bigint user_id FK
      datetime joined_at
    }
    TASK {
      bigint id PK
      bigint project_id FK
      bigint assignee_id FK
      bigint reporter_id FK
      string title
      text description
      string priority
      string status
      datetime due_date
      datetime completed_at
      boolean is_deleted
      datetime created_at
      datetime updated_at
    }
    COMMENT {
      bigint id PK
      bigint task_id FK
      bigint user_id FK
      text content
      datetime created_at
      datetime updated_at
    }
    ACTIVITY_LOG {
      bigint id PK
      bigint actor_id FK
      string entity_type
      bigint entity_id
      string action
      json metadata
      datetime created_at
    }
    NOTIFICATION {
      bigint id PK
      bigint user_id FK
      string type
      string content
      boolean is_read
      datetime created_at
    }
```

## 2. Enum

- `User.role`: `ADMIN`, `PROJECT_MANAGER`, `MEMBER`.
- `Project.status`: `PLANNING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`.
- `Task.priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- `Task.status`: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.

## 3. Ràng buộc và index

- `USER.email` duy nhất và được chuẩn hóa chữ thường.
- `PROJECT_MEMBER(project_id, user_id)` duy nhất.
- `PROJECT.owner` là người quản lý dự án; `PROJECT_MEMBER` chỉ thể hiện người tham gia để tránh hai nguồn quyền xung đột.
- `PROJECT.due_date >= start_date` khi cả hai có giá trị.
- `TASK.assignee_id` có thể rỗng, nhưng nếu có phải là thành viên dự án.
- Không xóa cứng task trong MVP; dùng `is_deleted`.
- Index: `project.owner_id`, `project_member.user_id`, `task.project_id`, `task.assignee_id`, `task.status`, `task.due_date`.
- Khi xóa dự án: ưu tiên chuyển `ARCHIVED`; không cascade xóa dữ liệu nghiệp vụ trong giao diện.
