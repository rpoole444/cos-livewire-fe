// components/WelcomeUser.tsx
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { User } from "@/interfaces/interfaces";

const WelcomeUser = () => {
  const { user, logout } = useAuth() as { user: User | null, logout: () => void };
  const router = useRouter();

  const handleLogout = async () => {
    try {
      logout();
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <>
      <h1 className="text-center text-sm md:text-base lg:text-lg p-2 bg-blue-100 text-blue-900 font-semibold rounded-md shadow">
        Welcome, {user?.first_name}! You are logged in.
      </h1>
      <br />
      <div className="flex flex-col items-center">
        <Link href="/eventSubmission" className="mb-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm text-center">
          Submit Event
        </Link>
        {user?.is_admin && (
          <>
            <Link href="/AdminUsersPage" className="mb-4 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm text-center">
              Admin Settings
            </Link>
            <Link href="/adminService" className="mb-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm text-center">
              Review Events
            </Link>
          </>
        )}
        <Link href="/UserProfile" className="mb-4 px-4 py-2 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 text-sm text-center">
          User Profile
        </Link>
        <button onClick={handleLogout} className="text-blue-500">
          Logout
        </button>
      </div>
    </>
  );
};

export default WelcomeUser;
