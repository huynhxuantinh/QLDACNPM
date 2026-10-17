import { CalendarDays, CircleUserRound, Pencil, Trash2 } from "lucide-react";

import { Avatar, EmptyState } from "../../components";
import type { Task, TaskStatus } from "../../types";
import { formatDueDate, groupTasksByStatus, TASK_COLUMNS } from "../../utils";

const priorityLabel = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", URGENT: "Khẩn cấp" };

interface Props {
  tasks: Task[];
  onStatusChange: (id: number, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  canManageTask?: (task: Task) => boolean;
}

export function TaskBoard({ tasks, onStatusChange, onEdit, onDelete, canManageTask }: Props) {
  const groups = groupTasksByStatus(tasks);
  return (
    <div className="task-board">
      {TASK_COLUMNS.map((column) => (
        <section className={`task-column column-${column.id.toLowerCase()}`} key={column.id}>
          <header><div><span className="column-dot" /><h3>{column.label}</h3><b>{groups[column.id].length}</b></div><small>{column.hint}</small></header>
          <div className="task-stack">
            {groups[column.id].map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-top"><span className={`priority priority-${task.priority.toLowerCase()}`}>{priorityLabel[task.priority]}</span><span className="task-actions">{(!canManageTask || canManageTask(task)) && <>{onEdit && <button aria-label={`Sửa ${task.title}`} onClick={() => onEdit(task)}><Pencil size={14} /></button>}{onDelete && <button aria-label={`Xóa ${task.title}`} onClick={() => onDelete(task)}><Trash2 size={14} /></button>}</>}</span></div>
                <h4>{task.title}</h4><p>{task.description || "Chưa có mô tả."}</p>
                <div className="task-meta"><span><CalendarDays size={15} />{formatDueDate(task.due_date)}</span></div>
                <footer>
                  <span className="assignee">{task.assignee ? <><Avatar user={task.assignee} size="sm" /><small>{task.assignee.full_name}</small></> : <><CircleUserRound size={24} /><small>Chưa giao</small></>}</span>
                  <select aria-label={`Trạng thái ${task.title}`} value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}>
                    {TASK_COLUMNS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
                  </select>
                </footer>
              </article>
            ))}
            {!groups[column.id].length && <EmptyState title="Chưa có việc" text="Cột này đang trống" />}
          </div>
        </section>
      ))}
    </div>
  );
}

