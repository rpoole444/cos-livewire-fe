import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAllUsers } from './api/route';
import { User, Users } from '../interfaces/interfaces';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Header from '@/components/Header';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const ITEMS_PER_PAGE = 10;

const AdminUsersPage = () => {
  const [users, setUsers] = useState<Users>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const data: any = await fetchAllUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleToggleAdminStatus = async (userId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const res = await fetch(`${API_BASE_URL}/api/auth/setAdmin/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_admin: newStatus }),
    });

    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: newStatus } : u));
    } else {
      alert('Error updating admin status.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const res = await fetch(`${API_BASE_URL}/api/auth/user/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      setUsers(users.filter(user => user.id !== userId));
    } else {
      alert('Failed to delete user.');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Admin: User Management</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full p-2 rounded-md border border-gray-300 text-black"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {paginatedUsers.map(user => (
          <div key={user.id} className="bg-white text-black p-6 rounded shadow flex justify-between items-center">
            <div>
              <p className="font-semibold">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.is_admin ? 'Admin' : 'User'}
              </span>
              <button
                onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                className={`px-3 py-1 rounded-md text-sm font-bold transition ${
                  user.is_admin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
                disabled={currentUser?.id === user.id}
              >
                {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
              </button>
              {currentUser?.id !== user.id && (
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm text-black rounded-md font-semibold"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="text-sm text-white disabled:text-gray-400"
          >
            ← Prev
          </button>
          <p className="text-sm">Page {currentPage} of {totalPages}</p>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="text-sm text-white disabled:text-gray-400"
          >
            Next →
          </button>
        </div>

        <div className="flex justify-between items-center mt-10">
          <Link href="/" className="text-indigo-300 hover:text-indigo-500 font-semibold">
            ← Back to Home
          </Link>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-600 font-semibold">
            Logout
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminUsersPage;
