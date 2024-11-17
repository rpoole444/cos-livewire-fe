import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAllUsers } from './api/route';
import { User, Users } from '../interfaces/interfaces';
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';



const AdminUsersPage = () => {
  const [users, setUsers] = useState<Users>([]);
  const router = useRouter();
  const { user, logout } = useAuth();
  useEffect(() => {
    // Fetch users
    const fetchUsers = async (): Promise<void> => {
      const data:any = await fetchAllUsers(); // Adjust API endpoint as needed

      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleLogout = async () => {
    try {  
      // await logoutUser()
        logout()
        router.push('/')
    } catch (err) {
      console.error(err)
    }
  };

 const handleToggleAdminStatus = async (userId: number, currentStatus: boolean) => {
  // Call API to toggle user admin status
  const newStatus = !currentStatus; // If current status is true, set to false, and vice versa
  const response = await fetch(`${API_BASE_URL}/api/auth/setAdmin/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_admin: newStatus }),
    credentials: 'include',
  });

  if (response.ok) {
    // Update the local state to reflect the change
    setUsers(users.map(user => user.id === userId ? { ...user, is_admin: newStatus } : user));
  } else {
    // Handle the error, e.g., by showing a message to the user
    console.error('Failed to update user admin status');
  }
};

  return (
    <div className="flex flex-col h-screen justify-between bg-black">
      <div className="flex flex-col items-center overflow-auto">
        <div className="w-full max-w-2xl mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-lg mt-8">
          <h1 className="text-2xl font-bold text-center text-black mb-4">Manage Users</h1>
          <ul className="space-y-3">
            {users?.map(user => (
              <li 
                key={user.id} 
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="font-semibold text-black">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="flex items-center">
                  <span className={`px-3 py-1 text-xs rounded-full ${user.is_admin ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                  <button 
                    onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                    className={`ml-4 px-4 py-2 text-xs font-bold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      user.is_admin ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300' : 'bg-green-500 hover:bg-green-600 focus:ring-green-300'
                    }`}
                  >
                    {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-white py-4 px-8 flex justify-between items-center border-t border-gray-300">
        <Link href='/'  className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Go Back to Homepage
        </Link>
        <button onClick={handleLogout} className="text-blue-500 font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminUsersPage;
