import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const origin = (site ? site.toString() : "https://clip-cut-alpha.vercel.app").replace(/\/+$/, "");
  const body = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
