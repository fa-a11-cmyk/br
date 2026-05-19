import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "pwa/icons/icon-192.png",
        "pwa/icons/icon-512.png",
        "pwa/icons/icon.svg",
        "offline.html",
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/offline\.html$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      manifest: {
        name: "RapidoMeet — Réunions en actions",
        short_name: "RapidoMeet",
        description: "Transcription IA de vos réunions. Tâches créées, CRM mis à jour, rapport WhatsApp en 3 minutes.",
        start_url: "/app/dashboard?source=pwa",
        scope: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        background_color: "#08080D",
        theme_color: "#E91E8C",
        orientation: "portrait-primary",
        lang: "fr",
        dir: "ltr",
        categories: ["productivity", "business", "utilities"],
        icons: [
          { src: "/pwa/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/pwa/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/pwa/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
        shortcuts: [
          {
            name: "Nouvelle réunion",
            short_name: "Réunion",
            description: "Démarrer l'enregistrement d'une nouvelle réunion",
            url: "/app/reunions/nouvelle?source=shortcut",
            icons: [{ src: "/pwa/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Mes tâches",
            short_name: "Tâches",
            description: "Voir et valider les tâches en attente",
            url: "/app/taches?source=shortcut",
            icons: [{ src: "/pwa/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Agenda",
            short_name: "Agenda",
            description: "Voir les réunions planifiées",
            url: "/app/agenda?source=shortcut",
            icons: [{ src: "/pwa/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
        share_target: {
          action: "/app/reunions/nouvelle",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url",
            files: [{ name: "audio", accept: ["audio/*", "video/*"] }],
          },
        },
        prefer_related_applications: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
