import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About Alpine Groove Guide</h1>

          <p className="text-lg mb-6">
            Welcome to <span className="text-yellow-400 font-semibold">Alpine Groove Guide</span> — a grassroots, community-powered calendar designed to showcase and support live music across Colorado Springs, Denver, and the greater Front Range.
          </p>

          <p className="text-lg mb-6">
            This platform was built by and for musicians, venues, and fans. Artists can submit gigs, venues can promote their shows, and locals can find live music that fits their vibe. Every submission is reviewed before going live to maintain accuracy and keep the calendar trustworthy.
          </p>

          <p className="text-lg mb-6">
            I’m <span className="text-yellow-400 font-semibold">Reid Poole</span> — a trumpet player, bandleader, and software engineer. After two decades performing across the country and teaching music at Dillard University in New Orleans, I moved back to Colorado with a mission: build tools that make it easier for artists to connect with their audiences and thrive.
          </p>

          <p className="text-lg mb-6">
            Alpine Groove Guide is my love letter to this community. Whether you’re a jazz cat, a punk rocker, a soulful singer, or a fan of good tunes — there’s space for you here.
          </p>

          <div className="flex items-center mt-10">
            <Image
              src="/reid_poole.jpeg"
              alt="Reid Poole"
              className="w-44 h-44 rounded-full mr-6 shadow-xl object-cover"
              width={176}
              height={176}
            />
            <div>
              <h2 className="text-2xl font-semibold">Reid Poole</h2>
              <p className="text-gray-400">Musician • Bandleader • Software Engineer</p>
              <p className="text-sm text-gray-500 mt-1">Founder, Alpine Groove Guide</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-3">🎶 Get Involved</h3>
            <p className="text-md mb-4">
              Want to promote your event? Just register and submit your show. Got feedback or ideas? I’d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/RegistrationPage" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-center">
                Create an Account
              </Link>
              <Link href="/eventSubmission" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-center">
                Submit an Event
              </Link>
              <a
                href="mailto:poole.reid@gmail.com"
                className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded text-center"
              >
                Contact Me
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-10 border-t border-gray-700 pt-6 text-sm text-gray-400">
            <p>Follow Alpine Groove Guide:</p>
            <div className="flex gap-4 mt-2">
              <a href="https://www.instagram.com/reid_poole_music/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Instagram
              </a>
              <a href="https://www.facebook.com/reidpoole" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Facebook
              </a>
              <a href="https://www.linkedin.com/in/reid-poole/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
