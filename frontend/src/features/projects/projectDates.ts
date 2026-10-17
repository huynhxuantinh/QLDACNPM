export const PROJECT_DATE_ERROR = "Hạn hoàn thành không được trước ngày bắt đầu.";

export function hasInvalidProjectDates(startDate: string, dueDate: string) {
  return Boolean(startDate && dueDate && dueDate < startDate);
}

export function todayForDateInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
