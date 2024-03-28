import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAllUsers } from './api/route';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);

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
    await fetch(`/api/users/setAdmin/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAdmin: true }),
    });

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
