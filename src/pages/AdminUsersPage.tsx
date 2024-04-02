import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAllUsers } from './api/route';
import { User, Users } from '../interfaces/interfaces';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<Users>([]);

  useEffect(() => {
    // Fetch users
    const fetchUsers = async (): Promise<void> => {
      const data:any = await fetchAllUsers(); // Adjust API endpoint as needed

      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleSetAdmin = async (userId:number) => {
    // Call API to set user as admin
    const response = await fetch(`/api/users/setAdmin/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAdmin: true }),
      credentials: 'include',
    });
    if(response.ok) {
        // Update the local state to reflect the change
        setUsers(users.map(user => user.id === userId ? {...user, is_admin: true} : user));
      } else {
        // Handle the error, e.g., by showing a message to the user
      }
    // Optionally, refresh the list of users or directly update the state
  };

  return (
  <div className="flex justify-center items-center h-screen black">
    <div className="w-full max-w-2xl mx-auto bg-gray p-8 border border-gray-300 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-4">Manage Users</h1>
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
            <div>
              <span className={`px-3 py-1 text-xs rounded-full ${user.is_admin ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                {user.is_admin ? 'Admin' : 'User'}
              </span>
            </div>
            <button 
              onClick={() => handleSetAdmin(user.id)}
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Make Admin
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
};

export default AdminUsersPage;
