
CREATE TYPE "AdminRole" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN'
);

CREATE TYPE "BannerType" AS ENUM (
    'HERO',
    'PROMO',
    'OFFER'
);

CREATE TYPE "OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);

CREATE TYPE "ProductCondition" AS ENUM (
    'NEW',
    'USED',
    'REFURBISHED'
);

CREATE TABLE "Admin" (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    "passwordHash" text NOT NULL,
    role "AdminRole" DEFAULT 'ADMIN'::"AdminRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE "Banner" (
    id text NOT NULL,
    type "BannerType" DEFAULT 'HERO'::"BannerType" NOT NULL,
    title text NOT NULL,
    subtitle text,
    "imageUrl" text,
    "linkUrl" text,
    "linkLabel" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE "Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "imageUrl" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE "ContactMessage" (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text,
    "customerName" text NOT NULL,
    "customerPhone" text NOT NULL,
    "customerEmail" text,
    address text NOT NULL,
    city text NOT NULL,
    notes text,
    status "OrderStatus" DEFAULT 'PENDING'::"OrderStatus" NOT NULL,
    total integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE "OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text,
    name text NOT NULL,
    price integer NOT NULL,
    quantity integer NOT NULL
);

CREATE TABLE "Product" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    description text,
    price integer NOT NULL,
    "discountPrice" integer,
    condition "ProductCondition" DEFAULT 'NEW'::"ProductCondition" NOT NULL,
    processor text NOT NULL,
    ram text NOT NULL,
    storage text NOT NULL,
    graphics text,
    display text,
    battery text,
    stock integer DEFAULT 0 NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isLatest" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "categoryId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE "ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    "publicId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "SiteSetting" (
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE "Testimonial" (
    id text NOT NULL,
    name text NOT NULL,
    role text,
    content text NOT NULL,
    rating integer DEFAULT 5 NOT NULL,
    "isPublished" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE "User" (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY "Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Banner"
    ADD CONSTRAINT "Banner_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "ContactMessage"
    ADD CONSTRAINT "ContactMessage_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "SiteSetting"
    ADD CONSTRAINT "SiteSetting_pkey" PRIMARY KEY (key);

ALTER TABLE ONLY "Testimonial"
    ADD CONSTRAINT "Testimonial_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);

CREATE UNIQUE INDEX "Admin_email_key" ON "Admin" USING btree (email);

CREATE UNIQUE INDEX "Category_name_key" ON "Category" USING btree (name);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category" USING btree (slug);

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem" USING btree ("orderId");

CREATE INDEX "Order_createdAt_idx" ON "Order" USING btree ("createdAt");

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order" USING btree ("orderNumber");

CREATE INDEX "Order_status_idx" ON "Order" USING btree (status);

CREATE INDEX "ProductImage_productId_idx" ON "ProductImage" USING btree ("productId");

CREATE INDEX "Product_brand_idx" ON "Product" USING btree (brand);

CREATE INDEX "Product_categoryId_idx" ON "Product" USING btree ("categoryId");

CREATE INDEX "Product_condition_idx" ON "Product" USING btree (condition);

CREATE INDEX "Product_createdAt_idx" ON "Product" USING btree ("createdAt");

CREATE INDEX "Product_price_idx" ON "Product" USING btree (price);

CREATE UNIQUE INDEX "Product_slug_key" ON "Product" USING btree (slug);

CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree (email);

ALTER TABLE ONLY "OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;

