-- CreateEnum
CREATE TYPE "PopupPage" AS ENUM ('HOME', 'SHOP', 'PRODUCT', 'OTHER');
CREATE TYPE "PopupFrequency" AS ENUM ('SESSION', 'ONCE');

-- Product scheduling + SEO
ALTER TABLE "Product" ADD COLUMN "publishAt" TIMESTAMP(3),
ADD COLUMN "unpublishAt" TIMESTAMP(3),
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT;

-- Banner / Testimonial scheduling
ALTER TABLE "Banner" ADD COLUMN "startsAt" TIMESTAMP(3),
ADD COLUMN "endsAt" TIMESTAMP(3);
ALTER TABLE "Testimonial" ADD COLUMN "startsAt" TIMESTAMP(3),
ADD COLUMN "endsAt" TIMESTAMP(3);

-- ProductVideo
CREATE TABLE "ProductVideo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductVideo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductVideo_productId_idx" ON "ProductVideo"("productId");
ALTER TABLE "ProductVideo" ADD CONSTRAINT "ProductVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PromoPopup
CREATE TABLE "PromoPopup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "badge" TEXT,
    "description" TEXT,
    "productId" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "price" INTEGER,
    "discountPrice" INTEGER,
    "condition" "ProductCondition",
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "whatsappMessage" TEXT,
    "placements" "PopupPage"[],
    "frequency" "PopupFrequency" NOT NULL DEFAULT 'SESSION',
    "delaySeconds" INTEGER NOT NULL DEFAULT 2,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromoPopup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PromoPopup_isActive_priority_idx" ON "PromoPopup"("isActive", "priority");
ALTER TABLE "PromoPopup" ADD CONSTRAINT "PromoPopup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
