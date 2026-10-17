import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardPage } from "./features/dashboard";
import { LoginPage, useAuth } from "./features/auth";
import { ProjectDetailPage, ProjectsPage } from "./features/projects";
import { TasksPage } from "./features/tasks";
import { AppShell } from "./layouts";
import { UsersPage } from "./pages";

function App() {
  const { user, loading, login } = useAuth();
  if (loading) return <main className="boot-screen"><span className="boot-logo">TF</span><p>Đang mở không gian làm việc...</p></main>;
  if (!user) return <LoginPage onLogin={login} />;
  return <AppShell><Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:id" element={<ProjectDetailPage />} />
    <Route path="/tasks" element={<TasksPage />} />
    <Route path="/users" element={user.role === "ADMIN" ? <UsersPage /> : <Navigate to="/" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell>;
}

export default App;
