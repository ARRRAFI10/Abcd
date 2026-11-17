const backendUrl = process.env.RENDER_BACKEND_URL?.replace(/\/+$/, "");

if (!backendUrl || !backendUrl.startsWith("https://")) {
  throw new Error("Set RENDER_BACKEND_URL to the HTTPS URL of the Render backend.");
}

export const config = {
  framework: "vite",
  outputDirectory: "dist",
  rewrites: [
    { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
    { source: "/media/:path*", destination: `${backendUrl}/media/:path*` },
    { source: "/:path*", destination: "/index.html" },
  ],
};
