import '../styles/globals.css';
import React, { useCallback, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import EventReview from '@/components/EventReview';
import ArtistReview from '@/components/ArtistReview';
import EventClaimReview from '@/components/EventClaimReview';
import { getPendingArtists } from '@/pages/api/artists';
import { getAdminSummary, getEventClaimRequests } from '@/pages/api/route';
import { useState } from 'react';
import { CalendarCheck, CheckCircle2, ExternalLink, FileDown, Handshake, ImagePlus, LogOut, Mail, Music2, ShieldCheck, UploadCloud, Users } from 'lucide-react';

interface AdminSummary {
  counts: {
    pending_events: number;
    pending_profiles: number;
    pending_claims: number;
  };
  recent_approved_events: Array<{
    id: number;
    title: string;
    slug: string;
    date?: string;
    start_time?: string;
    venue_name?: string;
    source_label?: string;
  }>;
  recent_imports: Array<{
    id: number;
    source: string;
    status?: string;
    created_at?: string;
    completed_at?: string;
    event_count: number;
    pending_count: number;
    accepted_count: number;
    rejected_count: number;
  }>;
  quick_links: Array<{
    label: string;
    href: string;
  }>;
}

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const AdminService: React.FC = () => {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [view, setView] = useState<'events' | 'artists' | 'claims'>('events');
  const [eventCount, setEventCount] = useState(0);
  const [artistCount, setArtistCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterPreview, setNewsletterPreview] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [newsletterSending, setNewsletterSending] = useState(false);

  const handleEventCountChange = useCallback((count: number) => setEventCount(count), []);
  const handleArtistCountChange = useCallback((count: number) => setArtistCount(count), []);
  const handleClaimCountChange = useCallback((count: number) => setClaimCount(count), []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/LoginPage?redirect=/AdminService');
      } else if (!user.is_admin) {
        router.replace('/');
      } else {
        setSummaryLoading(true);
        setSummaryError('');
        getAdminSummary()
          .then((data) => {
            setSummary(data);
            setEventCount(Number(data?.counts?.pending_events || 0));
            setArtistCount(Number(data?.counts?.pending_profiles || 0));
            setClaimCount(Number(data?.counts?.pending_claims || 0));
          })
          .catch((error) => {
            console.error('Failed to load admin summary', error);
            setSummaryError('Unable to load dashboard summary.');
          })
          .finally(() => setSummaryLoading(false));
        getPendingArtists()
          .then((profiles) => setArtistCount(Array.isArray(profiles) ? profiles.length : 0))
          .catch((error) => {
            console.error('Failed to preload pending profile count', error);
            setArtistCount(0);
          });
        getEventClaimRequests()
          .then((claims) => setClaimCount(Array.isArray(claims) ? claims.length : 0))
          .catch((error) => {
            console.error('Failed to preload pending claim count', error);
            setClaimCount(0);
          });
      }
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewsletter = async (dryRun = false) => {
    if (!newsletterSubject.trim() || !newsletterMessage.trim()) {
      setNewsletterStatus('Add a subject and message before sending.');
      return;
    }

    try {
      setNewsletterSending(true);
      setNewsletterStatus(dryRun ? 'Checking recipient count...' : 'Sending newsletter...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: newsletterSubject,
          preview_text: newsletterPreview,
          message: newsletterMessage,
          dry_run: dryRun,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to send newsletter.');
      }
      setNewsletterStatus(data?.message || (dryRun ? 'Preview complete.' : 'Newsletter sent.'));
    } catch (error) {
      console.error('Newsletter failed', error);
      setNewsletterStatus(error instanceof Error ? error.message : 'Unable to send newsletter.');
    } finally {
      setNewsletterSending(false);
    }
  };

  if (loading || !user || !user.is_admin) {
    return (
      <>
        <Head>
          <title>Alpine Groove Guide - Admin Review</title>
        </Head>
        <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center shadow-2xl shadow-black/40">
            <p className="text-sm text-slate-300">Checking admin access...</p>
          </div>
        </div>
      </>
    );
  }

  const totalPending = eventCount + artistCount + claimCount;
  const quickLinks = summary?.quick_links?.length ? summary.quick_links : [
    { label: 'Public calendar', href: '/' },
    { label: 'Artist directory', href: '/artists' },
    { label: 'Import Moondog', href: '/admin/import' },
    { label: 'Venue image cleanup', href: '/admin/venues/photos' },
    { label: 'Weekly promoter packet', href: '/admin/promoter-packet' },
    { label: 'Public weekly poster', href: '/weekly-poster' },
    { label: 'User management', href: '/AdminUsersPage' },
  ];
  const activeViewCopy =
    view === 'events'
      ? 'Review submitted shows, clean up details, and approve calendar listings.'
      : view === 'artists'
        ? 'Review artist, venue, and promoter profile submissions, media, contact details, and moderation notes.'
        : 'Review artist requests to claim existing imported, venue-created, or promoter-created events.';

  return (
    <>
      <Head>
        <title>Alpine Groove Guide - Admin Review</title>
      </Head>
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Console
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                    Review queue
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Welcome, {user.displayName || user.display_name || user.first_name}. Keep the public calendar and Pro directory clean before new submissions go live.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/AdminUsersPage"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
                  >
                    <Users className="h-4 w-4" />
                    User management
                  </Link>
                  <Link
                    href="/admin/import"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-white"
                  >
                    <FileDown className="h-4 w-4" />
                    Import batches
                  </Link>
                  <Link
                    href="/admin/venues/photos"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-400/60 hover:text-white"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Venue images
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-400 hover:bg-red-500/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total pending</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-50">{totalPending}</p>
                </div>
                <button
                  onClick={() => setView('events')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    view === 'events'
                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarCheck className="h-4 w-4" />
                    Events
                  </span>
                  <span className="mt-2 block text-2xl font-semibold">{eventCount}</span>
                </button>
                <button
                  onClick={() => setView('artists')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    view === 'artists'
                      ? 'border-purple-400/70 bg-purple-500/15 text-purple-100'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Music2 className="h-4 w-4" />
                    Profiles
                  </span>
                  <span className="mt-2 block text-2xl font-semibold">{artistCount}</span>
                </button>
                <button
                  onClick={() => setView('claims')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    view === 'claims'
                      ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-100'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Handshake className="h-4 w-4" />
                    Claims
                  </span>
                  <span className="mt-2 block text-2xl font-semibold">{claimCount}</span>
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Command center</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-50">What needs attention</h2>
                </div>
                {summaryLoading && <span className="text-xs text-slate-400">Refreshing summary...</span>}
              </div>
              {summaryError && (
                <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {summaryError}
                </div>
              )}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setView('events')}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-left transition hover:border-emerald-300/70"
                >
                  <CalendarCheck className="h-5 w-5 text-emerald-300" />
                  <p className="mt-3 text-3xl font-semibold text-slate-50">{eventCount}</p>
                  <p className="text-sm font-semibold text-emerald-100">Pending events</p>
                </button>
                <button
                  type="button"
                  onClick={() => setView('artists')}
                  className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4 text-left transition hover:border-purple-300/70"
                >
                  <Music2 className="h-5 w-5 text-purple-300" />
                  <p className="mt-3 text-3xl font-semibold text-slate-50">{artistCount}</p>
                  <p className="text-sm font-semibold text-purple-100">Pending profiles</p>
                </button>
                <button
                  type="button"
                  onClick={() => setView('claims')}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-left transition hover:border-cyan-300/70"
                >
                  <Handshake className="h-5 w-5 text-cyan-300" />
                  <p className="mt-3 text-3xl font-semibold text-slate-50">{claimCount}</p>
                  <p className="text-sm font-semibold text-cyan-100">Pending claims</p>
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-white"
                  >
                    {link.label}
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recently approved</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-50">Latest live events</h2>
              <div className="mt-5 space-y-3">
                {(summary?.recent_approved_events || []).length > 0 ? (
                  summary?.recent_approved_events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/eventRouter/${event.slug}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-400/60"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">{event.title}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(event.date)}
                            {event.venue_name ? ` • ${event.venue_name}` : ''}
                            {event.source_label ? ` • ${event.source_label}` : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                    No approved events found yet.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent imports</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-50">Import activity</h2>
              </div>
              <Link
                href="/admin/import"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:text-white"
              >
                <UploadCloud className="h-4 w-4" />
                New import
              </Link>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {(summary?.recent_imports || []).length > 0 ? (
                summary?.recent_imports.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/admin/imports/${batch.id}?source=${encodeURIComponent(batch.source || 'moondog')}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-400/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold capitalize text-slate-100">{batch.source}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(batch.created_at)}</p>
                      </div>
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                        {batch.status || 'draft'}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-900 p-2">
                        <p className="text-lg font-semibold text-slate-50">{batch.event_count}</p>
                        <p className="text-slate-500">Total</p>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2">
                        <p className="text-lg font-semibold text-amber-200">{batch.pending_count}</p>
                        <p className="text-slate-500">Pending</p>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2">
                        <p className="text-lg font-semibold text-emerald-200">{batch.accepted_count}</p>
                        <p className="text-slate-500">Accepted</p>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2">
                        <p className="text-lg font-semibold text-rose-200">{batch.rejected_count}</p>
                        <p className="text-slate-500">Rejected</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                  No import batches yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">User newsletter</p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-50">
                  <Mail className="h-5 w-5 text-amber-200" />
                  Send a platform update
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Write one short update for registered users. Use this for feature announcements, onboarding notes,
                  and “here is what you can do now” messages.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Subject</span>
                <input
                  value={newsletterSubject}
                  onChange={(event) => setNewsletterSubject(event.target.value)}
                  placeholder="What’s new on Alpine Groove Guide"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Preview line optional</span>
                <input
                  value={newsletterPreview}
                  onChange={(event) => setNewsletterPreview(event.target.value)}
                  placeholder="New profile tools, claim requests, calendar imports, and more."
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Message</span>
                <textarea
                  value={newsletterMessage}
                  onChange={(event) => setNewsletterMessage(event.target.value)}
                  rows={8}
                  placeholder={"Hi everyone,\n\nHere are the newest Alpine Groove Guide tools available to you..."}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-amber-300"
                />
              </label>
              {newsletterStatus && (
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                  {newsletterStatus}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={newsletterSending}
                  onClick={() => handleNewsletter(true)}
                  className="rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-300 disabled:opacity-60"
                >
                  Preview recipient count
                </button>
                <button
                  type="button"
                  disabled={newsletterSending}
                  onClick={() => {
                    const confirmed = window.confirm('Send this newsletter to all registered users?');
                    if (confirmed) handleNewsletter(false);
                  }}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
                >
                  {newsletterSending ? 'Working...' : 'Send newsletter'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {view === 'events' ? 'Calendar moderation' : view === 'artists' ? 'Directory moderation' : 'Claim moderation'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">
                  {view === 'events' ? 'Pending events' : view === 'artists' ? 'Pending profiles' : 'Pending event claims'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{activeViewCopy}</p>
              </div>
              <div className="grid grid-cols-3 rounded-full border border-slate-800 bg-slate-950/80 p-1">
                <button
                  onClick={() => setView('events')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    view === 'events' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => setView('artists')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    view === 'artists' ? 'bg-purple-400 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Profiles
                </button>
                <button
                  onClick={() => setView('claims')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    view === 'claims' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Claims
                </button>
              </div>
            </div>

            {view === 'events' ? (
              <EventReview onCountChange={handleEventCountChange} />
            ) : view === 'artists' ? (
              <ArtistReview onCountChange={handleArtistCountChange} />
            ) : (
              <EventClaimReview onCountChange={handleClaimCountChange} />
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminService;
