import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Comentado temporalmente debido a errores de compatibilidad
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // Comentado temporalmente debido a errores de compatibilidad
    // runtimeErrorOverlay(),
    // ...(process.env.NODE_ENV !== "production" &&
    // process.env.REPL_ID !== undefined
    //   ? [
    //       await import("@replit/vite-plugin-cartographer").then((m) =>
    //         m.cartographer(),
    //       ),
    //     ]
    //   : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core (React, React DOM, Router)
          'react-vendor': ['react', 'react-dom', 'wouter'],
          
          // UI Components (Radix UI, Lucide, Framer Motion)
          'ui-components': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'framer-motion',
            'vaul',
            'cmdk',
            'input-otp',
            'react-day-picker',
            'react-resizable-panels',
            'embla-carousel-react'
          ],
          
          // Charts and Data Visualization
          'charts': ['chart.js', 'recharts'],
          
          // Forms and Validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod', 'zod-validation-error'],
          
          // State Management and Data Fetching
          'state': ['@tanstack/react-query'],
          
          // Utilities
          'utils': [
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'nanoid',
            'next-themes'
          ],
          
          // Icons
          'icons': ['react-icons']
        }
      }
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
