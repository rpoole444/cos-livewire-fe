import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchAllUsers } from './api/route';
import { User, Users } from '../interfaces/interfaces';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<Users>([]);
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data : any = await fetchAllUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    fetchUsers();
  }, []);

  const handleToggleAdminStatus = async (userId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/setAdmin/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_admin: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: newStatus } : u));
    } catch (err) {
      alert('Failed to update admin status.');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error("Failed to delete");

      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      alert('Failed to delete user.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center">User Management</h1>
        <div className="space-y-6">
          {users.map(user => (
            <div key={user.id} className="bg-white text-black p-5 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-lg font-semibold">{user.first_name} {user.last_name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-700'}`}>
                  {user.is_admin ? 'Admin' : 'Standard'}
                </span>
                <button
                  onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                  className={`px-4 py-1 text-sm font-medium rounded transition ${
                    user.is_admin ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  disabled={currentUser?.id === user.id}
                >
                  {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                </button>
                {currentUser?.id !== user.id && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="px-4 py-1 text-sm font-medium rounded bg-gray-200 hover:bg-gray-300 text-black"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-700">
          <Link href="/" className="text-indigo-400 hover:text-indigo-200 text-sm font-medium">
            ← Back to Home
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-600 text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
