import formsPlugin from '@tailwindcss/forms';
import typographyPlugin from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand & Dark surfaces
        brand: {
          dark: '#0F172A',      // Primary dark (Slate 900)
          surface: '#1E293B',   // Secondary dark (Slate 800)
          border: '#334155',    // Dark border (Slate 700)
          muted: '#475569',     // Muted dark (Slate 600)
        },
        // Accents
        emerald: {
          accent: '#34D399',    // Emerald accent for primary CTAs & badges
          dark: '#10B981',      // Deep emerald hover
          light: '#6EE7B7',     // Soft emerald highlight
        },
        lime: {
          accent: '#A3E635',    // Lime accent for highlights & discounts
          dark: '#84CC16',
        },
        // Clean Workspace surfaces
        workspace: {
          DEFAULT: '#F8FAFC',   // Light canvas background
          card: '#FFFFFF',      // Card surface
          border: '#E2E8F0',    // Card border
          hover: '#F1F5F9',     // Hover background
        },
        // Typography tokens
        text: {
          primary: '#0F172A',   // Slate 900
          secondary: '#64748B', // Slate 500
          muted: '#94A3B8',     // Slate 400
          inverted: '#F8FAFC',  // Text on dark brand surfaces
        },
        // Semantic statuses
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '0.75rem',     // 12px for cards
        'pill': '9999px',      // Pills and tags
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [formsPlugin, typographyPlugin],
};
