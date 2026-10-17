import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Layers3 } from "lucide-react";

interface Props { onLogin: (email: string, password: string) => Promise<void> | void }

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Đăng nhập không thành công.");
    } finally {
      setLoading(false);
    }
  };

  const useDemo = () => {
    setEmail("manager@taskflow.local");
    setPassword("Demo123!");
  };

  return (
    <main className="login-shell">
      <section className="login-story" aria-label="Giới thiệu TaskFlow">
        <div className="brand-mark"><Layers3 size={22} /> TF</div>
        <div className="story-copy">
          <p className="eyebrow light">Không gian làm việc nội bộ</p>
          <h1>Cùng đội ngũ biến kế hoạch thành <em>kết quả.</em></h1>
          <p>TaskFlow gom dự án, đầu việc và tiến độ vào một nhịp làm việc rõ ràng.</p>
          <div className="trust-row">
            <span><CheckCircle2 size={18} /> Theo dõi tức thời</span>
            <span><CheckCircle2 size={18} /> Phân quyền rõ ràng</span>
          </div>
        </div>
        <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" />
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <div><p className="eyebrow">Chào mừng trở lại</p><h2>Đăng nhập TaskFlow</h2><p className="muted">Tiếp tục quản lý công việc của đội ngũ.</p></div>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ten@congty.vn" required /></label>
          <label>Mật khẩu
            <span className="password-field">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
              <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button login-button" disabled={loading} type="submit">{loading ? "Đang đăng nhập..." : "Đăng nhập"}<ArrowRight size={18} /></button>
          <button className="demo-box" type="button" onClick={useDemo}>
            <span><strong>Tài khoản demo</strong><small>Nhấn để điền nhanh</small></span>
            <span><code>manager@taskflow.local</code><code>Demo123!</code></span>
          </button>
        </form>
      </section>
    </main>
  );
}

