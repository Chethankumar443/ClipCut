import type { APIRoute } from "astro";

const ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0", image: "/brand/clipcut-logo.png" },
  { path: "/docs", changefreq: "weekly", priority: "0.9" },
  { path: "/docs/quickstart", changefreq: "weekly", priority: "0.9" },
  { path: "/docs/ai-providers", changefreq: "weekly", priority: "0.85" },
  { path: "/docs/deployment", changefreq: "monthly", priority: "0.8" },
  { path: "/docs/gaming-mode", changefreq: "monthly", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/acceptable-use", changefreq: "yearly", priority: "0.3" },
];

export const GET: APIRoute = ({ site }) => {
  const origin = (site ? site.toString() : "https://clip-cut-alpha.vercel.app").replace(/\/+$/, "");
  const lastmod = new Date().toISOString().split("T")[0];
  const urls = ROUTES.map((r) => {
    const loc = r.path === "/" ? `${origin}/` : `${origin}${r.path}`;
    const imgBlock = r.image
      ? `\n    <image:image>\n      <image:loc>${origin}${r.image}</image:loc>\n      <image:title>ClipCut — Free Open-Source AI Video Clipping Studio</image:title>\n    </image:image>`
      : "";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>${imgBlock}\n  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
