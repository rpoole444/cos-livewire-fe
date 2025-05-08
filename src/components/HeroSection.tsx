// components/HeroSection.tsx
import React from 'react';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="bg-black text-white py-16 px-4 md:px-12 lg:px-24 text-center relative overflow-hidden">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gold mb-6">
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
        <Link href="/eventSubmission">
          <button className="border border-gold text-gold font-semibold py-3 px-6 rounded-md hover:bg-gold hover:text-black transition duration-200 ease-in-out">
            Submit Your Show
          </button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
