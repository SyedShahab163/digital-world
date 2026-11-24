-- Promotional ads are opt-in: every existing popup becomes a DRAFT and must be published explicitly.
-- The master switch is the SiteSetting row "promo_ads_enabled"; a missing row means OFF.
CREATE TYPE "PopupStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "PromoPopup" ADD COLUMN "status" "PopupStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "activeDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

DROP INDEX "PromoPopup_isActive_priority_idx";
CREATE INDEX "PromoPopup_status_isActive_priority_idx" ON "PromoPopup"("status", "isActive", "priority");
