const apiUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";


function App() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          TaskFlow
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Hệ thống đã sẵn sàng.</h1>
        <p className="mt-4 leading-7 text-slate-400">
          React, Django REST Framework và PostgreSQL đang chạy độc lập bằng Docker Compose.
        </p>
        <a
          className="mt-8 inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
          href={`${apiUrl}/health/`}
          target="_blank"
          rel="noreferrer"
        >
          Kiểm tra Backend API
        </a>
      </section>
    </main>
  );
}

export default App;
