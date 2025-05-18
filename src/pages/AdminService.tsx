import '../styles/globals.css';
import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import EventReview from '@/components/EventReview';

const AdminService: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      logout();
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">
          Welcome, {user?.first_name}! 🎧
        </h1>
        <p className="text-center text-md text-gray-300 max-w-2xl mx-auto">
          You’re an admin for Alpine Groove Guide. Review pending events for grammar, clarity, and content.
        </p>

        <EventReview />

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <Link href="/" className="bg-gold hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded">
            Back to Homepage
          </Link>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium underline">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminService;