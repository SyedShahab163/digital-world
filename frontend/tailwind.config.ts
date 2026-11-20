import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const v = (n: string) => `rgb(var(--c-${n}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        navy: { DEFAULT: v("navy"), 800: v("navy-800"), 700: v("navy-700") },
        slateblue: v("slateblue"),
        brand: { DEFAULT: v("brand"), dark: v("brand-dark"), soft: v("brand-soft") },
        cyan: { DEFAULT: v("accent") },
        canvas: v("canvas"),
        ink: v("ink"),
        muted: "#64748B",
        line: "#E2E8F0",
        border: "#E2E8F0",
        input: "#CBD5E1",
        ring: v("brand"),
        background: v("canvas"),
        foreground: v("ink"),
        primary: { DEFAULT: v("brand"), foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#F1F5F9", foreground: "#1E293B" },
        destructive: { DEFAULT: "#DC2626", foreground: "#FFFFFF" },
        accent: { DEFAULT: "#F1F5F9", foreground: "#1E293B" },
        card: { DEFAULT: "#FFFFFF", foreground: "#1E293B" },
        popover: { DEFAULT: "#FFFFFF", foreground: "#1E293B" },
        "muted-foreground": "#64748B",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { lg: "var(--r-lg)", xl: "var(--r-xl)", "2xl": "var(--r-2xl)", btn: "var(--r-btn)", md: "0.5rem", sm: "0.375rem" },
      boxShadow: {
        lift: "0 1px 2px rgba(16,24,40,.04), 0 12px 32px -12px rgba(16,24,40,.18)",
        glow: "0 0 0 1px rgba(37,99,235,.25), 0 20px 60px -20px rgba(37,99,235,.55)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: { float: "float 7s ease-in-out infinite" },
    },
  },
  plugins: [animate],
};
export default config;
