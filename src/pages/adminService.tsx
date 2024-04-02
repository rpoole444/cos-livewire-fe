import '../styles/globals.css';
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from './api/route';
import Link from "next/link";
import { useRouter } from "next/router";
import EventReview from '@/components/EventReview';

const adminService = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

const handleLogout = async () => {
    try {  
      // await logoutUser()
        logout()
        router.push('/')
    } catch (err) {
      console.error(err)
    }
  };
  return (
    <div className="flex flex-col items-center space-y-4 ">
      <h1>Admin Page</h1>
      <EventReview />
      <Link href='/' className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Go Back to Homepage
      </Link>
      <button  onClick={handleLogout} className="mt-4 text-blue-500">
        Logout
      </button>
    </div>
  )
}

export default adminService;