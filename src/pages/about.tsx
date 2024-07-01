import Header from '@/components/Header';
import Image from 'next/image';
const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About Us</h1>
          <p className="text-lg mb-6">
            Welcome to the Alpine Groove Guide! This is a community calendar aimed at Colorado Springs and Denver&apos;s music scene. We encourage users to register, login, and start creating events!
          </p>
          <p className="text-lg mb-6">
            Submitted events are reviewed for acceptance, decline, or edits. Upon acceptance, they are posted to the site. This ensures that our calendar remains a reliable source of information for the community.
          </p>
          <p className="text-lg mb-6">
            I am Reid Poole, a musician and software engineer. I created this platform as a solution for the community so that artists and locals could market their events and find things to do easily!
          </p>
          <div className="flex items-center mt-8">
            <Image src="/reid_poole.jpeg" alt="Reid Poole" className="w-44 h-54 rounded-full mr-4 shadow-lg" width={400} height={400}/>
            <div>
              <h2 className="text-2xl font-semibold">Reid Poole</h2>
              <p className="text-gray-400">Musician and Software Engineer</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
