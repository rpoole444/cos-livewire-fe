import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronLeft, ChevronRight, LogOut, Search, ShieldCheck, Trash2, UserCog, UsersRound } from 'lucide-react';
import { fetchAllUsers } from '@/lib/api';
import { User, Users } from '../interfaces/interfaces';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const ITEMS_PER_PAGE = 10;

const AdminUsersPage = () => {
  const [users, setUsers] = useState<Users>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { user: currentUser, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.replace('/LoginPage?redirect=/AdminUsersPage');
      } else if (!currentUser.is_admin) {
        router.replace('/');
      }
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (loading || !currentUser?.is_admin) return;

    const fetchUsers = async () => {
      try {
        setIsFetching(true);
        setErrorMessage('');
        const data = await fetchAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setErrorMessage('Unable to load users. Please refresh or try again in a moment.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchUsers();
  }, [currentUser?.is_admin, loading]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.first_name, user.last_name, user.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery, users]);

  const adminCount = users.filter((user) => user.is_admin).length;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleToggleAdminStatus = async (userId: number, currentStatus: boolean) => {
    setStatusMessage('');
    setErrorMessage('');

    try {
      const newStatus = !currentStatus;
      const res = await fetch(`${API_BASE_URL}/api/auth/setAdmin/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_admin: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Error updating admin status.');
      }

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, is_admin: newStatus } : user)));
      setStatusMessage(newStatus ? 'Admin access granted.' : 'Admin access revoked.');
    } catch (err) {
      console.error('Error updating admin status:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error updating admin status.');
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (!confirm(`Delete ${userToDelete.email}? This cannot be undone.`)) return;

    setStatusMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to delete user (status ${res.status})`);
      }

      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      setStatusMessage(`Deleted ${userToDelete.email}.`);
    } catch (err) {
      console.error('Delete user failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong deleting the user.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading || !currentUser || !currentUser.is_admin) {
    return (
      <>
        <Head>
          <title>Alpine Groove Guide - User Management</title>
        </Head>
        <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center shadow-2xl shadow-black/40">
            <p className="text-sm text-slate-300">Checking admin access...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Alpine Groove Guide - User Management</title>
      </Head>
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <Link href="/AdminService" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Back to review queue
                </Link>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                    <UsersRound className="h-4 w-4" />
                    Admin Console
                  </div>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                    User management
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Search accounts, manage admin access, and remove users when needed.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Users</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-50">{users.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Admins</p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-300">{adminCount}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100 transition hover:border-red-400 hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Directory</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Accounts</h2>
              </div>
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 pl-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </div>
            )}
            {statusMessage && (
              <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {statusMessage}
              </div>
            )}

            {isFetching ? (
              <div className="px-5 py-12 text-center text-sm text-slate-300">Loading users...</div>
            ) : paginatedUsers.length > 0 ? (
              <div className="mt-5 divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800">
                {paginatedUsers.map((user) => {
                  const isSelf = currentUser.id === user.id;
                  return (
                    <div key={user.id} className="grid gap-4 bg-slate-950/50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-50">
                            {user.first_name} {user.last_name}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              user.is_admin
                                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                                : 'border-slate-700 bg-slate-900 text-slate-300'
                            }`}
                          >
                            {user.is_admin ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserCog className="h-3.5 w-3.5" />}
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                          {isSelf && <span className="text-xs text-slate-500">You</span>}
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-400">{user.email}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <button
                          onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.is_admin
                              ? 'border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:border-amber-300'
                              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300'
                          }`}
                          disabled={isSelf}
                        >
                          {user.is_admin ? 'Revoke admin' : 'Make admin'}
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:border-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-slate-300">No users match that search.</div>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <p className="text-sm text-slate-400">
                Page <span className="font-semibold text-slate-100">{currentPage}</span> of {totalPages}
              </p>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminUsersPage;
