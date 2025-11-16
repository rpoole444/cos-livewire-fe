import Header from '@/components/Header';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-gray-300">
            Welcome to Alpine Groove Guide. We connect musicians, venues, and the community with show listings, artist profiles, and Alpine Pro subscriptions. By using the site you agree to these terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Accounts &amp; Responsibilities</h2>
            <p className="text-gray-300">
              Keep your login secure and only provide accurate information. You are responsible for everything posted from your account and for complying with local laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Subscriptions &amp; Billing</h2>
            <p className="text-gray-300">
              Alpine Pro payments are processed through Stripe. Subscriptions renew automatically until canceled in the billing portal. When you cancel, access remains active until the current billing period ends.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Artist &amp; Venue Content</h2>
            <p className="text-gray-300">
              You retain ownership of the content you upload. Do not post anything illegal, abusive, or wildly off-topic. We reserve the right to remove content that violates these guidelines or the spirit of the community.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Availability &amp; Liability</h2>
            <p className="text-gray-300">
              We work hard to keep the platform online and accurate, but we can’t guarantee uninterrupted service. Alpine Groove Guide is provided “as is” without warranties. To the fullest extent permitted by law, our liability is limited to the fees you paid in the past 12 months.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="text-gray-300">
              Questions? Reach us at <a href="mailto:support@alpinegrooveguide.com" className="underline text-blue-300">support@alpinegrooveguide.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
