// Built-in content. Used until the admin publishes something, and for any field the admin has not set.
// Legacy `home_*` / `seo_*` site settings (from the earlier Settings page) are honoured as defaults so
// nothing the admin already typed is lost.
export type Obj = Record<string, unknown>;

export const FONT_OPTIONS = ["Inter", "Space Grotesk", "Manrope", "Sora", "DM Sans", "Plus Jakarta Sans", "Outfit", "Montserrat"] as const;
export const SECTION_IDS = ["categories", "featured", "media_banner", "why", "offers", "latest", "testimonials", "cta"] as const;
export const WHY_ICONS = ["laptop", "price", "support", "shield", "truck", "star", "wrench", "clock"] as const;

export const siteDefaults = (): Obj => ({
  logos: { mainAsset: null, mobileAsset: null, footerAsset: null, faviconAsset: null },
  design: {
    colors: { navy: "#101828", brand: "#2563EB", accent: "#06B6D4", slateblue: "#344767", canvas: "#F8FAFC", ink: "#1E293B" },
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    buttonStyle: "rounded", // rounded | pill | square
    corners: "soft", // sharp | soft | round
  },
  header: {
    navLinks: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    showCategoriesMenu: true,
    categoriesLabel: "Categories",
  },
  footer: {
    about: "Premium new, used and refurbished laptops for work, gaming, business and study across Pakistan.",
    columns: [{ title: "Quick links", links: [{ label: "Shop all laptops", href: "/shop" }, { label: "Categories", href: "/categories" }, { label: "About us", href: "/about" }, { label: "Contact", href: "/contact" }] }],
    showCategories: true,
    copyright: "Rizvi Laptops. All rights reserved.",
    note: "Prices are in Pakistani Rupees (PKR).",
  },
  seo: { title: "", description: "", keywords: "", ogAsset: null },
});

export const homeDefaults = (): Obj => ({
  hero: {
    title: "Find Your Perfect Laptop.",
    subtitle: "Discover powerful laptops for work, gaming, business, and everyday productivity.",
    primaryLabel: "Explore Laptops",
    primaryHref: "/shop",
    secondaryLabel: "Contact Us",
    secondaryHref: "/contact",
    media: "spotlight", // spotlight | image | video | illustration
    imageAsset: null,
    videoAsset: null,
    posterAsset: null,
    showBanner: true,
  },
  sections: [
    { id: "categories", enabled: true, title: "Shop by category", text: "Start with how you will use your laptop." },
    { id: "featured", enabled: true, title: "Featured laptops", text: "Hand-picked models from our current stock." },
    { id: "media_banner", enabled: false, title: "", text: "", buttonLabel: "", buttonHref: "", imageAsset: null, videoAsset: null },
    { id: "why", enabled: true, title: "Why choose Rizvi Laptops?", text: "A straightforward laptop store: clear specs, clear prices, and a real person on the phone." },
    { id: "offers", enabled: true, title: "Special offers", text: "Discounted laptops while stock lasts." },
    { id: "latest", enabled: true, title: "Latest arrivals", text: "Recently added to the store." },
    { id: "testimonials", enabled: true, title: "What customers say", text: "" },
    { id: "cta", enabled: true, title: "Ready to Find Your Next Laptop?", text: "Browse the collection, or call and WhatsApp us and we will help you choose.", buttonLabel: "Shop laptops", buttonHref: "/shop" },
  ],
  whyItems: [
    { icon: "laptop", title: "Quality products", text: "Every listing shows the processor, RAM, storage, display and condition, so you know exactly what you are buying." },
    { icon: "price", title: "Competitive prices", text: "Clear prices in PKR, with discounts shown right on the product whenever one is running." },
    { icon: "support", title: "Customer support", text: "Call or WhatsApp us and we will help you compare options and choose the right laptop." },
    { icon: "shield", title: "Wide laptop selection", text: "New, used and refurbished laptops from well-known brands across business, gaming, study and budget needs." },
    { icon: "truck", title: "Reliable service", text: "Place your order online and our team contacts you by phone to confirm the details." },
  ],
});

export const pageDefaults = (title = ""): Obj => ({ title, body: "", seoTitle: "", seoDescription: "", ogAsset: null, heroAsset: null, showInFooter: false });

export const SYSTEM_PAGES: { slug: string; title: string; footer: boolean }[] = [
  { slug: "about", title: "About Us", footer: false },
  { slug: "contact", title: "Contact", footer: false },
  { slug: "privacy-policy", title: "Privacy Policy", footer: true },
  { slug: "terms", title: "Terms & Conditions", footer: true },
  { slug: "shipping-policy", title: "Shipping & Delivery", footer: true },
  { slug: "warranty-policy", title: "Warranty", footer: true },
];

// Routes that exist in the app (or are reserved) and can never be used as a custom page slug.
export const RESERVED_SLUGS = ["shop", "categories", "products", "checkout", "cart", "admin", "api", "uploads", "search", "login", "track", "sitemap.xml", "robots.txt", "_next", "cms-preview", "cms-revalidate"];

/** Deep-merge: plain objects merge key by key; arrays and scalars from `over` replace the base. */
export function merge<T extends Obj>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over)) return base;
  const out: Obj = { ...base };
  for (const [k, v] of Object.entries(over as Obj)) {
    const b = out[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" && !Array.isArray(v) ? merge(b as Obj, v) : v === undefined ? b : v;
  }
  return out as T;
}
