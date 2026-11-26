import type { APIRoute } from "astro";

const ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/docs", changefreq: "weekly", priority: "0.9" },
  { path: "/docs/quickstart", changefreq: "weekly", priority: "0.9" },
  { path: "/docs/ai-providers", changefreq: "monthly", priority: "0.8" },
  { path: "/docs/deployment", changefreq: "monthly", priority: "0.8" },
  { path: "/docs/gaming-mode", changefreq: "monthly", priority: "0.8" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/acceptable-use", changefreq: "yearly", priority: "0.3" },
];

export const GET: APIRoute = ({ site }) => {
  const origin = (site ? site.toString() : "https://clipcut.vercel.app").replace(/\/+$/, "");
  const lastmod = new Date().toISOString().split("T")[0];
  const urls = ROUTES.map(
    (r) =>
      `  <url>\n    <loc>${origin}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
