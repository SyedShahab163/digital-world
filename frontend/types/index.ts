export type Condition = "NEW" | "USED" | "REFURBISHED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface ProductImage { id: string; url: string; publicId?: string | null; sortOrder: number }
export interface ProductVideo { id: string; url: string; publicId?: string | null; sortOrder: number }
export type ScheduleState = "LIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "DRAFT" | "INACTIVE";
export interface Category {
  id: string; name: string; slug: string; description?: string | null; imageUrl?: string | null; sortOrder: number;
  _count?: { products: number };
}
export interface Product {
  id: string; name: string; slug: string; brand: string; model: string; description?: string | null;
  price: number; discountPrice?: number | null; condition: Condition;
  processor: string; ram: string; storage: string; graphics?: string | null; display?: string | null; battery?: string | null;
  stock: number; isFeatured: boolean; isLatest: boolean; isActive: boolean;
  publishAt?: string | null; unpublishAt?: string | null; seoTitle?: string | null; seoDescription?: string | null; videos?: ProductVideo[];
  categoryId?: string | null; category?: Category | null; images: ProductImage[]; createdAt: string; updatedAt: string;
}
export interface Meta { page: number; limit: number; total: number; totalPages: number }
export interface ApiList<T> { success: true; data: T[]; meta: Meta }
export interface Testimonial { id: string; name: string; role?: string | null; content: string; rating: number; isPublished: boolean; startsAt?: string | null; endsAt?: string | null; status?: ScheduleState }
export interface Banner {
  id: string; type: "HERO" | "PROMO" | "OFFER"; title: string; subtitle?: string | null; imageUrl?: string | null;
  linkUrl?: string | null; linkLabel?: string | null; isActive: boolean; sortOrder: number; startsAt?: string | null; endsAt?: string | null; status?: ScheduleState;
}
export interface OrderItem { id: string; name: string; price: number; quantity: number; productId?: string | null }
export interface Order {
  id: string; orderNumber: string; customerName: string; customerPhone: string; customerEmail?: string | null;
  address: string; city: string; notes?: string | null; status: OrderStatus; total: number; createdAt: string; items: OrderItem[];
}
export interface ContactMessage { id: string; name: string; email?: string | null; phone?: string | null; message: string; isRead: boolean; createdAt: string }
export interface FilterOptions {
  brands: string[]; rams: string[]; storages: string[]; processors: string[]; conditions: Condition[]; minPrice: number; maxPrice: number;
}
export type Settings = Record<
  | "contact_phone" | "contact_whatsapp" | "contact_email" | "address" | "business_hours"
  | "facebook_url" | "instagram_url" | "tiktok_url" | "youtube_url"
  | "announcement_text" | "announcement_active" | "delivery_policy" | "warranty_policy" | "about_text"
  | "seo_title" | "seo_description" | "seo_keywords" | "seo_og_image"
  | "home_hero_title" | "home_hero_subtitle" | "home_primary_cta" | "home_secondary_cta" | "home_cta_title" | "home_cta_text",
  string
>;
export interface AdminUser { id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN" }

export type PopupPage = "HOME" | "SHOP" | "PRODUCT" | "OTHER";
/** Display-ready popup, resolved by the API (linked laptop data already merged in). */
export interface ResolvedPopup {
  id: string | null; badge: string | null; name: string; description: string | null; imageUrl: string | null;
  price: number; discountPrice: number | null; discountPercent: number; condition: Condition | null;
  ctaLabel: string; ctaUrl: string; whatsappMessage: string; frequency: "SESSION" | "ONCE"; delaySeconds: number; version: string;
}
export interface AdminPopup {
  id: string; title: string; badge?: string | null; description?: string | null; productId?: string | null;
  imageUrl?: string | null; imagePublicId?: string | null; price?: number | null; discountPrice?: number | null; condition?: Condition | null;
  ctaLabel?: string | null; ctaUrl?: string | null; whatsappMessage?: string | null; placements: PopupPage[];
  frequency: "SESSION" | "ONCE"; delaySeconds: number; priority: number; isActive: boolean; startsAt?: string | null; endsAt?: string | null;
  activeDays: number[]; publishedAt?: string | null;
  /** Computed by the API: DRAFT | INACTIVE | EXPIRED | SCHEDULED | LIVE (anything but DRAFT means published). */
  status: ScheduleState;
  resolved: ResolvedPopup; product?: { name: string } | null;
}

export interface PopupSummary { masterEnabled: boolean; masterUpdatedAt: string | null; total: number; active: number; draft: number; inactive: number; expired: number; scheduled: number }
