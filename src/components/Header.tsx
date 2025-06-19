import React, { useState } from 'react';
import Link from 'next/link';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="w-full bg-black text-white px-4 sm:px-8 py-4 shadow-lg flex justify-between items-center">
      <div className="flex items-center">
       <Link href="/" className="flex items-center">
          <Image
            src="/alpine_groove_guide_icon.png"
            alt="Alpine Groove Guide Icon"
            width={60}
            height={60}
            className="rounded"
          />
       </Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ml-4 text-gold">
          Alpine Groove Guide
        </h1>
      </div>

      <div className="relative">
        <button onClick={toggleMenu} className="text-white focus:outline-none lg:hidden">
          {menuOpen ? <AiOutlineClose size={28} /> : <AiOutlineMenu size={28} />}
        </button>

        <nav
          className={`${
            menuOpen ? 'absolute right-0 top-16 bg-black shadow-md p-4 rounded-md z-50' : 'hidden'
          } lg:flex lg:items-center lg:space-x-6 transition duration-300 ease-in-out`}
        >
          <Link href="/" className="block lg:inline-block text-white hover:text-gold transition">
            Home
          </Link>
          <Link href="/about" className="block lg:inline-block text-white hover:text-gold transition">
            About Us
          </Link>
          {user && !user.is_pro && user.is_admin && (
            <Link
              href="/upgrade"
              className="block lg:inline-block text-white hover:text-gold transition"
            >
              Upgrade to Pro
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
