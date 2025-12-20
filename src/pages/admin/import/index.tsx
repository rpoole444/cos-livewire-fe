import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const AdminImportPage = () => {
  const { isAuthorized, loading, user } = useAdminRouteGuard();
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | null>(null);

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
              Paste the raw calendar text and send it to the Moondog parser.
            </p>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!rawText.trim() || isSubmitting) return;
                setIsSubmitting(true);
                setStatusMessage(null);
                setStatusTone(null);

                try {
                  const res = await fetch(`${API_BASE_URL}/api/admin/imports/moondog`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ raw_text: rawText }),
                  });

                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    const message = data?.message || `Import failed with status ${res.status}`;
                    setStatusMessage(message);
                    setStatusTone('error');
                    return;
                  }

                  const batchId = data?.batchId ?? data?.batch_id ?? data?.id;
                  if (!batchId) {
                    setStatusMessage('Import succeeded but no batch ID was returned.');
                    setStatusTone('error');
                    return;
                  }

                  setStatusMessage('Import started. Redirecting to batch details…');
                  setStatusTone('success');
                  router.push(`/admin/imports/${batchId}`);
                } catch (error) {
                  console.error('Import request failed:', error);
                  setStatusMessage('Something went wrong submitting the import.');
                  setStatusTone('error');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="mt-6 space-y-4"
            >
              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Paste Moondog calendar listings here…"
                rows={10}
                className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting || !rawText.trim()}
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Parsing…' : 'Parse Moondog Listings'}
                </button>
                <Link
                  href="/AdminService"
                  className="rounded-full border border-slate-700/80 bg-slate-900 px-5 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Review submissions
                </Link>
              </div>
              {statusMessage && (
                <p
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    statusTone === 'success'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {statusMessage}
                </p>
              )}
            </form>
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
