import Link from 'next/link';

const SiteFooter = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 text-xs py-6 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-center sm:text-left">© {new Date().getFullYear()} Alpine Groove Guide</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-gray-200 underline-offset-2">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-gray-200 underline-offset-2">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
