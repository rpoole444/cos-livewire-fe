import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';

const AdminImportBatchPage = () => {
  const router = useRouter();
  const { batchId } = router.query;
  const { isAuthorized, loading } = useAdminRouteGuard();
  const batchIdValue = Array.isArray(batchId) ? batchId[0] : batchId;

  if (loading || !isAuthorized || !router.isReady) {
    return (
      <>
        <Head>
        <title>Import Batch – Alpine Groove Guide</title>
      </Head>
        <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">Loading import batch…</h1>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Import Batch {batchIdValue ?? ''} – Alpine Groove Guide</title>
      </Head>
      <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Admin Tools</p>
            <h1 className="mt-3 text-3xl font-semibold">Import batch {batchIdValue}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Track the status, errors, and imported records for this batch.
            </p>
          </header>

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <h2 className="text-lg font-semibold">Batch status</h2>
            <p className="mt-2 text-sm text-slate-400">
              Connect this panel to your backend to show counts, failures, and rollbacks.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Records</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">—</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Errors</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">—</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">Pending</p>
              </div>
            </div>
          </section>

          <Link
            href="/admin/import"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            ← Back to import
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminImportBatchPage;
