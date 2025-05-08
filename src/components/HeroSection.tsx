// components/HeroSection.tsx
import React from 'react';
import Link from 'next/link';

const HeroSection = ({ user, setAuthMode }: { user: any, setAuthMode: (mode: string) => void }) => {
  return (
    <section className="bg-black text-white min-h-[90vh] py-24 px-6 md:px-16 lg:px-32 text-center flex flex-col justify-center items-center">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gold mb-6 transition duration-500 ease-in-out transform hover:-translate-y-1">
        Discover & Share Live Music in Colorado Springs
      </h1>
      <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
        Alpine Groove Guide is your go-to hub for upcoming concerts, local shows, and independent music events.
        Find gigs, promote your own, and stay connected with the scene.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/#events">
          <button className="bg-gold text-black font-semibold py-3 px-6 rounded-md hover:bg-yellow-400 transition duration-200 ease-in-out">
            Browse Events
          </button>
        </Link>
        <Link href={user ? "/eventSubmission" : "/login?redirect=/eventSubmission"}>
          <button className="border border-gold text-gold font-semibold py-3 px-6 rounded-md hover:bg-gold hover:text-black transition duration-200 ease-in-out">
            Submit Your Show
          </button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
