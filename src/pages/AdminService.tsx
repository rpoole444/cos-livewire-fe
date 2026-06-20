import '../styles/globals.css';
import React, { useCallback, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import EventReview from '@/components/EventReview';
import ArtistReview from '@/components/ArtistReview';
import { getPendingArtists } from '@/pages/api/artists';
import { useState } from 'react';
import { CalendarCheck, FileDown, LogOut, Music2, ShieldCheck, Users } from 'lucide-react';

const AdminService: React.FC = () => {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [view, setView] = useState<'events' | 'artists'>('events');
  const [eventCount, setEventCount] = useState(0);
  const [artistCount, setArtistCount] = useState(0);

  const handleEventCountChange = useCallback((count: number) => setEventCount(count), []);
  const handleArtistCountChange = useCallback((count: number) => setArtistCount(count), []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/LoginPage?redirect=/AdminService');
      } else if (!user.is_admin) {
        router.replace('/');
      } else {
        getPendingArtists()
          .then((profiles) => setArtistCount(Array.isArray(profiles) ? profiles.length : 0))
          .catch((error) => {
            console.error('Failed to preload pending profile count', error);
            setArtistCount(0);
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

  const totalPending = eventCount + artistCount;
  const activeViewCopy =
    view === 'events'
      ? 'Review submitted shows, clean up details, and approve calendar listings.'
      : 'Review artist, venue, and promoter profile submissions, media, contact details, and moderation notes.';

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
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {view === 'events' ? 'Calendar moderation' : 'Directory moderation'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">
                  {view === 'events' ? 'Pending events' : 'Pending profiles'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{activeViewCopy}</p>
              </div>
              <div className="grid grid-cols-2 rounded-full border border-slate-800 bg-slate-950/80 p-1">
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
              </div>
            </div>

            {view === 'events' ? (
              <EventReview onCountChange={handleEventCountChange} />
            ) : (
              <ArtistReview onCountChange={handleArtistCountChange} />
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminService;
