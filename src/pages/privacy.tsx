import Head from "next/head";

const PrivacyPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy – Alpine Groove Guide</title>
      </Head>
    <div className="px-6 py-12 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-gray-300">
            This policy explains how Alpine Groove Guide collects, uses, and protects your information when you create an account, publish a Pro page for your artist, venue, or promoter series, or subscribe to Alpine Pro.
          </p>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Information We Collect</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Account details such as your name, email address, and password hash.</li>
              <li>Profile data like display name, genres, descriptions, and uploaded media.</li>
              <li>Billing identifiers from Stripe (customer ID, subscription status) &mdash; we never store full card numbers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">How We Use It</h2>
            <p className="text-gray-300">
              We use your information to operate the site, personalize your profile, manage subscriptions, send essential transactional emails, and keep Alpine Groove Guide safe and reliable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Cookies &amp; Analytics</h2>
            <p className="text-gray-300">
              We may use cookies to keep you logged in and understand basic traffic patterns. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Sharing</h2>
            <p className="text-gray-300">
              We share necessary payment data with Stripe to process subscriptions. We don’t sell or rent your personal information to advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Your Choices</h2>
            <p className="text-gray-300">
              You can update most profile details from your dashboard. If you need help deleting or exporting data, email us and we’ll do our best to assist while honoring legal obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="text-gray-300">
              Reach us at <a href="mailto:support@alpinegrooveguide.com" className="underline text-blue-300">support@alpinegrooveguide.com</a> with privacy questions.
            </p>
          </section>
      </div>
    </div>
    </>
  );
};

export default PrivacyPage;
