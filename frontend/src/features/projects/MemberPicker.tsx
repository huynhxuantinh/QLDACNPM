import { useEffect, useState, type FormEvent } from "react";

import { api } from "../../api";
import type { ProjectMember, UserOption } from "../../types";

interface MemberPickerProps {
  projectId: number;
  members: ProjectMember[];
  onAdded: () => void | Promise<void>;
  onCancel: () => void;
}

export function MemberPicker({ projectId, members, onAdded, onCancel }: MemberPickerProps) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<UserOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const page = await api.userOptions(query.trim());
        if (!active) return;
        const memberIds = new Set(members.map((member) => member.user.id));
        const available = page.results.filter((candidate) => !memberIds.has(candidate.id));
        setCandidates(available);
        setSelectedId((current) => available.some((candidate) => String(candidate.id) === current) ? current : "");
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách người dùng.");
      } finally {
        if (active) setLoading(false);
      }
    }, query ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [members, query]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      await api.addProjectMember(projectId, Number(selectedId));
      await onAdded();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể thêm thành viên.");
    } finally {
      setSubmitting(false);
    }
  };

  return <form className="modal-form" onSubmit={submit}>
    <label>Tìm người dùng
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nhập tên hoặc email"
      />
    </label>
    <label>Chọn người dùng
      <select
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        required
        disabled={loading || candidates.length === 0}
      >
        <option value="">{loading ? "Đang tải..." : candidates.length ? "Chọn một người" : "Không có người phù hợp"}</option>
        {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>
          {candidate.full_name} — {candidate.email}
        </option>)}
      </select>
    </label>
    <p className="form-hint">Chỉ hiển thị tài khoản đang hoạt động và chưa thuộc dự án.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions">
      <button type="button" className="ghost-button" onClick={onCancel}>Hủy</button>
      <button className="primary-button" disabled={!selectedId || submitting}>
        {submitting ? "Đang thêm..." : "Thêm thành viên"}
      </button>
    </div>
  </form>;
}
