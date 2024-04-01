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
    <div>
      <h1>Manage Users</h1>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.email} - Admin Status: {user.is_admin ? 'Yes' : 'No'}
            <button onClick={() => handleSetAdmin(user.id)}>Make Admin</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminUsersPage;
