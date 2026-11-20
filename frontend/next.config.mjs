/** @type {import('next').NextConfig} */
const backend = process.env.BACKEND_URL || "http://localhost:4000";

const remotePatterns = [
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "http", hostname: "localhost", port: "4000" },
  { protocol: "http", hostname: "localhost", port: "3000" },
];
try {
  const u = new URL(backend);
  remotePatterns.push({
    protocol: u.protocol.replace(":", ""),
    hostname: u.hostname,
    ...(u.port ? { port: u.port } : {}),
  });
} catch {}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { remotePatterns, formats: ["image/avif", "image/webp"] },
  // The browser only ever talks to the Next.js origin; API + uploads are proxied.
  // That keeps the admin cookie first-party and the backend URL out of client code.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
