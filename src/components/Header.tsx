import React, { useState } from 'react';
import Link from 'next/link';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="w-full bg-indigo-800 text-white p-6 shadow-md flex justify-between items-center">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
        Alpine Groove Guide
      </h1>
      <div className="relative">
        <button onClick={toggleMenu} className="text-white focus:outline-none lg:hidden">
          {menuOpen ? <AiOutlineClose size={28} /> : <AiOutlineMenu size={28} />}
        </button>
        <nav className={`${menuOpen ? 'block' : 'hidden'} lg:flex lg:items-center lg:space-x-6`}>
          <Link href="/" className="block lg:inline-block mt-4 lg:mt-0 text-white hover:text-gray-300">
            Home
          </Link>
          <Link href="/about" className="block lg:inline-block mt-4 lg:mt-0 text-white hover:text-gray-300">
            About Us
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
