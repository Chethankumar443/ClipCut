import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const origin = (site ? site.toString() : "https://clipcut.vercel.app").replace(/\/+$/, "");
  const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
