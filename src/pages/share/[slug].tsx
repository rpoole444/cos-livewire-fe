// pages/share/[slug].tsx
import { fetchEventDetailsBySlug } from "../api/route";

export const getServerSideProps = async (context:any) => {
  const slug = context.params?.slug;
  const event = await fetchEventDetailsBySlug(slug);

  if (!event) {
    context.res.statusCode = 404;
    context.res.end("Not Found");
    return { props: {} };
  }

  const imageUrl = event.poster?.startsWith("http")
    ? event.poster
    : "https://app.alpinegrooveguide.com/alpine_groove_guide_icon.png";

  const description =
    event.description?.slice(0, 150) ||
    "Discover live music across Colorado with Alpine Groove Guide.";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${event.title}</title>
        <meta property="og:title" content="${event.title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://app.alpinegrooveguide.com/share/${slug}" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta name="twitter:title" content="${event.title}" />
        <meta name="twitter:description" content="${description}" />
        <meta http-equiv="refresh" content="1;url=/eventRouter/${slug}" />
      </head>
      <body style="font-family:sans-serif;text-align:center;padding-top:2rem">
        <p>Redirecting to <a href="/eventRouter/${slug}">${event.title}</a>...</p>
      </body>
    </html>
  `;

  context.res.setHeader("Content-Type", "text/html");
  context.res.end(html);
  return { props: {} }; // required to avoid errors but does not render
};

export default function SharePage() {
  return null;
}
