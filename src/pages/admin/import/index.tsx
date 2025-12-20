import Head from 'next/head';
import Link from 'next/link';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';

const AdminImportPage = () => {
  const { isAuthorized, loading, user } = useAdminRouteGuard();

  if (loading || !isAuthorized) {
    return (
      <>
        <Head>
          <title>Admin Import – Alpine Groove Guide</title>
        </Head>
        <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">Checking access…</h1>
            <p className="mt-2 text-sm text-slate-400">Verifying your admin session.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Import – Alpine Groove Guide</title>
      </Head>
      <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Admin Tools</p>
            <h1 className="mt-3 text-3xl font-semibold">Import pipeline</h1>
            <p className="mt-2 text-sm text-slate-400">
              Hi {user?.displayName || user?.display_name || 'admin'}, upload curated CSVs and track the batch
              status before they go live.
            </p>
          </header>

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <h2 className="text-xl font-semibold">Start a new import</h2>
            <p className="mt-2 text-sm text-slate-400">
              Wire this to your import workflow or backend endpoint. This page is guarded to admins only.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white">
                Upload CSV
              </button>
              <Link
                href="/AdminService"
                className="rounded-full border border-slate-700/80 bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                Review submissions
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <h2 className="text-lg font-semibold text-slate-100">Need a batch link?</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use the batch ID from your import service to jump to a specific run at
              <span className="text-slate-200"> /admin/imports/&lt;batchId&gt;</span>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminImportPage;
