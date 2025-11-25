import Head from "next/head";

const ContactPage = () => {
  return (
    <>
      <Head>
        <title>Contact – Alpine Groove Guide</title>
      </Head>
    <div className="px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="text-gray-300">
          Need help with Alpine Groove Guide? Send us a note at{" "}
          <a href="mailto:support@alpinegrooveguide.com" className="underline text-blue-300">
            support@alpinegrooveguide.com
          </a>{" "}
          and we’ll reply as soon as possible.
        </p>
      </div>
    </div>
    </>
  );
};

export default ContactPage;
