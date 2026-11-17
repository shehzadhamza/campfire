import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campfire",
    short_name: "Campfire",
    description: "Keep the fire going with the guys you care about.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c11",
    theme_color: "#0a0c11",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
