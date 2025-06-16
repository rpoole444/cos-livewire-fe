// pages/share/artist/[slug].tsx
import { getArtistBySlug } from "../../api/artists";

export const getServerSideProps = async (context: any) => {
  const slug = context.params?.slug;
  let artist = null;
  try {
    artist = await getArtistBySlug(slug);
  } catch (err) {
    artist = null;
  }

  if (!artist) {
    context.res.statusCode = 404;
    context.res.end("Not Found");
    return { props: {} };
  }

  const imageUrl = artist.profile_image?.startsWith("http")
    ? artist.profile_image
    : "https://app.alpinegrooveguide.com/alpine_groove_guide_icon.png";

  const description =
    artist.bio?.slice(0, 150) ||
    "Discover live music across Colorado with Alpine Groove Guide.";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${artist.display_name}</title>
        <meta property="fb:app_id" content="1227448998748931" />
        <meta property="og:title" content="${artist.display_name}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://app.alpinegrooveguide.com/share/artist/${slug}" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta name="twitter:title" content="${artist.display_name}" />
        <meta name="twitter:description" content="${description}" />
        <meta http-equiv="refresh" content="1;url=/artists/${slug}" />
      </head>
      <body style="font-family:sans-serif;text-align:center;padding-top:2rem">
        <p>Redirecting to <a href="/artists/${slug}">${artist.display_name}</a>...</p>
      </body>
    </html>
  `;

  context.res.setHeader("Content-Type", "text/html");
  context.res.end(html);
  return { props: {} };
};

export default function ShareArtistPage() {
  return null;
}
