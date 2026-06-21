import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';
import { DEFAULT_REGION, MUSIC_REGIONS } from '@/constants/regions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ProfileOption = {
  id: number;
  display_name: string;
  slug: string;
  profile_type: 'artist' | 'venue' | 'promoter';
  home_region?: string | null;
  venue_address?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  website?: string | null;
  age_policy?: string | null;
  profile_image?: string | null;
};

const AdminImportPage = () => {
  const { isAuthorized, loading, user } = useAdminRouteGuard();
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [venueDefaults, setVenueDefaults] = useState({
    venue_name: '',
    address: '',
    city: '',
    website: '',
    age_policy: '',
    poster: '',
    region: DEFAULT_REGION,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchProfileOptions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/admin/options`, { credentials: 'include' });
        const data = await res.json().catch(() => []);
        if (res.ok && Array.isArray(data)) {
          setProfileOptions(data);
        }
      } catch (error) {
        console.error('Unable to load import profile options', error);
      }
    };

    fetchProfileOptions();
  }, [isAuthorized]);

  const venueOptions = profileOptions.filter((profile) => profile.profile_type === 'venue');

  const applySelectedVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
    const venue = venueOptions.find((profile) => String(profile.id) === venueId);
    if (!venue) {
      setVenueDefaults({
        venue_name: '',
        address: '',
        city: '',
        website: '',
        age_policy: '',
        poster: '',
        region: DEFAULT_REGION,
      });
      return;
    }

    setVenueDefaults({
      venue_name: venue.display_name || '',
      address: venue.venue_address || '',
      city: venue.venue_city || '',
      website: venue.website || '',
      age_policy: venue.age_policy || '',
      poster: venue.profile_image || '',
      region: venue.home_region || DEFAULT_REGION,
    });
  };

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
              Paste raw calendar text and send it to the Moondog parser. Each event should be one line after a date heading.
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
                    body: JSON.stringify({
                      raw_text: rawText,
                      defaults: {
                        venue_profile_id: selectedVenueId || null,
                        ...venueDefaults,
                      },
                    }),
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
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Venue fast-import defaults</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Optional: choose a venue profile to prefill venue metadata across every parsed row. You can still edit individual rows before moving them to review.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Venue profile
                    <select
                      value={selectedVenueId}
                      onChange={(event) => applySelectedVenue(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    >
                      <option value="">No venue defaults</option>
                      {venueOptions.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.display_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Region
                    <select
                      value={venueDefaults.region}
                      onChange={(event) => setVenueDefaults((prev) => ({ ...prev, region: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    >
                      {MUSIC_REGIONS.map((region) => (
                        <option key={region.slug} value={region.slug}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {[
                    ['venue_name', 'Venue name'],
                    ['address', 'Address'],
                    ['city', 'City'],
                    ['website', 'Website'],
                    ['age_policy', 'Age policy'],
                    ['poster', 'Default poster URL'],
                  ].map(([field, label]) => (
                    <label key={field} className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {label}
                      <input
                        value={venueDefaults[field as keyof typeof venueDefaults]}
                        onChange={(event) => setVenueDefaults((prev) => ({ ...prev, [field]: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                      />
                    </label>
                  ))}
                </div>
              </div>
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
            <h2 className="text-lg font-semibold text-slate-100">Recommended paste format</h2>
            <p className="mt-2 text-sm text-slate-400">
              Keep dates as headings, then use <span className="text-slate-200">Venue, Artist, Time</span>. Multiple artists are allowed, but the parser may flag them so an admin can review the row before it moves to the calendar.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
{`Sunday, June 21

Armadillo Ranch, The Broken Rose Unplugged, 1 p.m.
Buffalo Lodge, RV Casino, Annette & Doug Conlon, Co Spgs Pickers, 2 p.m.
Cantina Verde, Matt Cravatta, 5 p.m.`}
            </pre>
            <p className="mt-4 text-sm text-slate-400">
              This same staged-review pattern is the right foundation for venue fast-add later: a venue can paste a weekly calendar, apply venue defaults like address, region, age policy, and website, then review before submitting.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminImportPage;
