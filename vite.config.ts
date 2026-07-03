import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const buildVersion = process.env.VITE_APP_VERSION || process.env.LOVABLE_DEPLOYMENT_ID || `${Date.now()}`;

const appendBuildVersionToHtmlAssets = () => ({
  name: "tioga-versioned-html-assets",
  generateBundle(_: unknown, bundle: Record<string, any>) {
    for (const asset of Object.values(bundle)) {
      if (asset.type !== "asset" || asset.fileName !== "index.html" || typeof asset.source !== "string") continue;
      asset.source = asset.source
        .replace(/(<script\b[^>]*\bsrc=")([^"?#]+\.(?:js))("[^>]*>)/g, `$1$2?v=${buildVersion}$3`)
        .replace(/(<link\b[^>]*\bhref=")([^"?#]+\.(?:css))("[^>]*>)/g, `$1$2?v=${buildVersion}$3`)
        .replace(/<head>/, `<head>\n    <meta name="tioga-build-id" content="${buildVersion}" />`);
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [react(), mode === "development" && componentTagger(), appendBuildVersionToHtmlAssets()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
          ],
          "motion-vendor": ["framer-motion"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "query-vendor": ["@tanstack/react-query"],
        },
      },
    },
  },
}));
