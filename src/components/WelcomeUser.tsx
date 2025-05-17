import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { UserType } from "@/types";
const WelcomeUser = () => {
  const { user, logout } = useAuth() as { user: UserType | null, logout: () => void };
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
    <div className="space-y-6">
      <div className="bg-blue-100 text-blue-900 text-sm font-semibold px-4 py-2 rounded shadow text-center">
        Welcome, {user?.displayName}! You’re logged in.
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/eventSubmission"
          className="w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition"
        >
          Submit Event
        </Link>

        {user?.is_admin && (
          <>
            <Link
              href="/AdminUsersPage"
              className="w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition"
            >
               Manage Admin Users
            </Link>
            <Link
              href="/adminservice"
              className="w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
            >
               Review & Approve Events
            </Link>
          </>
        )}

        <Link
          href="/UserProfile"
          className="w-full text-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-md transition"
        >
          👤 User Profile
        </Link>

        <button
          onClick={handleLogout}
          className="w-full text-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition"
        >
         Logout
        </button>
      </div>
    </div>
  );
};

export default WelcomeUser;
