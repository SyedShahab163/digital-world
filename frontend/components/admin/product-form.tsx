"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, ImagePlus, Loader2, Star, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "./ui";
import { ScheduleBadge, ScheduleFields, stateOf } from "./schedule";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { Category, Product } from "@/types";
import { conditionLabel, formatPKR, fromLocalInput, toLocalInput } from "@/lib/utils";

const num = (label: string) => z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), z.number({ error: `${label} must be a number` }));

const schema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(160),
  brand: z.string().trim().min(1, "Enter a brand"),
  model: z.string().trim().min(1, "Enter a model"),
  categoryId: z.string().optional(),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]),
  price: num("Price").pipe(z.number().int("Use whole rupees").min(1, "Enter a price")),
  discountPrice: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(1).optional()),
  stock: num("Stock").pipe(z.number().int().min(0, "Stock cannot be negative")),
  processor: z.string().trim().min(1, "Enter the processor"),
  ram: z.string().trim().min(1, "Enter the RAM"),
  storage: z.string().trim().min(1, "Enter the storage"),
  graphics: z.string().trim().optional(),
  display: z.string().trim().optional(),
  battery: z.string().trim().optional(),
  description: z.string().trim().max(5000).optional(),
  seoTitle: z.string().trim().max(70, "Keep it under 70 characters").optional(),
  seoDescription: z.string().trim().max(180, "Keep it under 180 characters").optional(),
  isFeatured: z.boolean(),
  isLatest: z.boolean(),
  isActive: z.boolean(),
}).refine((d) => d.discountPrice == null || d.discountPrice < d.price, { path: ["discountPrice"], message: "Discount price must be lower than the regular price" });

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;
interface Img { url: string; publicId?: string | null }

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { data: categories } = useFetch<Category[]>("/admin/categories");
  const [images, setImages] = useState<Img[]>(product?.images.map((i) => ({ url: i.url, publicId: i.publicId })) ?? []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<Img[]>(product?.videos?.map((v) => ({ url: v.url, publicId: v.publicId })) ?? []);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const [publishAt, setPublishAt] = useState(toLocalInput(product?.publishAt));
  const [unpublishAt, setUnpublishAt] = useState(toLocalInput(product?.unpublishAt));
  const [scheduleError, setScheduleError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { register, control, handleSubmit, getValues, watch, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "", brand: product?.brand ?? "", model: product?.model ?? "", categoryId: product?.categoryId ?? "",
      condition: product?.condition ?? "NEW", price: product?.price ?? ("" as unknown as number), discountPrice: product?.discountPrice ?? ("" as unknown as number),
      stock: product?.stock ?? 1, processor: product?.processor ?? "", ram: product?.ram ?? "", storage: product?.storage ?? "",
      seoTitle: product?.seoTitle ?? "", seoDescription: product?.seoDescription ?? "",
      graphics: product?.graphics ?? "", display: product?.display ?? "", battery: product?.battery ?? "", description: product?.description ?? "",
      isFeatured: product?.isFeatured ?? false, isLatest: product?.isLatest ?? true, isActive: product?.isActive ?? true,
    },
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length + files.length > 10) { toast.error("You can add up to 10 photos."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));
      const stored = await api.post<Img[]>("/admin/upload", fd);
      setImages((prev) => [...prev, ...stored]);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const uploadVideos = async (files: FileList | null) => {
    if (!files?.length) return;
    if (videos.length + files.length > 3) { toast.error("You can add up to 3 videos."); return; }
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("videos", f));
      const stored = await api.post<Img[]>("/admin/upload/video", fd);
      setVideos((prev) => [...prev, ...stored]);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setUploadingVideo(false); if (videoRef.current) videoRef.current.value = ""; }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, n) => n !== i));
  const makeCover = (i: number) => setImages((prev) => [prev[i], ...prev.filter((_, n) => n !== i)]);

  const onSubmit = async (v: FormOutput) => {
    setScheduleError("");
    const body = {
      ...v, categoryId: v.categoryId || null, discountPrice: v.discountPrice ?? null,
      images: images.map((i) => ({ url: i.url, publicId: i.publicId ?? null })),
      videos: videos.map((i) => ({ url: i.url, publicId: i.publicId ?? null })),
      publishAt: fromLocalInput(publishAt), unpublishAt: fromLocalInput(unpublishAt),
    };
    try {
      if (product) await api.put(`/admin/products/${product.id}`, body); else await api.post("/admin/products", body);
      toast.success(product ? "Changes saved" : "Laptop added");
      router.push("/admin/products");
    } catch (e) {
      if (e instanceof Error && /unpublish/i.test(e.message)) setScheduleError(e.message);
      toast.error(errMsg(e));
    }
  };

  const live = watch("isActive");
  const state = stateOf({ enabled: !!live, start: fromLocalInput(publishAt), end: fromLocalInput(unpublishAt) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Basic details</h2>
          <Field label="Product name" error={errors.name?.message} hint="Shown as the page title, e.g. Dell Latitude 5420"><Input aria-invalid={!!errors.name} {...register("name")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand" error={errors.brand?.message}><Input aria-invalid={!!errors.brand} {...register("brand")} /></Field>
            <Field label="Model" error={errors.model?.message}><Input aria-invalid={!!errors.model} {...register("model")} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><Select {...register("categoryId")}><option value="">No category</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Condition"><Select {...register("condition")}><option value="NEW">New</option><option value="USED">Used</option><option value="REFURBISHED">Refurbished</option></Select></Field>
          </div>
          <Field label="Description" error={errors.description?.message}><Textarea rows={5} {...register("description")} /></Field>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Specifications</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Processor" error={errors.processor?.message}><Input placeholder="Intel Core i5 11th Gen" aria-invalid={!!errors.processor} {...register("processor")} /></Field>
            <Field label="RAM" error={errors.ram?.message}><Input placeholder="16GB DDR4" aria-invalid={!!errors.ram} {...register("ram")} /></Field>
            <Field label="Storage" error={errors.storage?.message}><Input placeholder="512GB SSD" aria-invalid={!!errors.storage} {...register("storage")} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Graphics"><Input placeholder="Intel Iris Xe" {...register("graphics")} /></Field>
            <Field label="Display"><Input placeholder='14" FHD' {...register("display")} /></Field>
            <Field label="Battery"><Input placeholder="e.g. Up to 6 hours" {...register("battery")} /></Field>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Photos</h2><span className="text-sm text-muted">{images.length}/10 · first photo is the cover</span></div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <li key={img.url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-slate-50">
                <Image src={img.url} alt={`Photo ${i + 1}`} fill sizes="200px" className="object-contain p-1" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[11px] font-semibold text-white">Cover</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {i !== 0 ? <button type="button" onClick={() => makeCover(i)} aria-label="Make cover photo" className="rounded-md bg-white/90 p-1.5"><Star className="h-4 w-4" /></button> : <span />}
                  <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo" className="rounded-md bg-white/90 p-1.5 text-destructive"><X className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || images.length >= 10} className="grid aspect-[4/3] w-full place-items-center rounded-xl border-2 border-dashed border-input text-sm text-muted transition hover:border-brand hover:text-brand disabled:opacity-50">
                <span className="grid place-items-center gap-1">{uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}{uploading ? "Uploading…" : "Add photos"}</span>
              </button>
            </li>
          </ul>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => upload(e.target.files)} />
          <p className="text-xs text-muted">JPG, PNG, WebP or AVIF, up to 8 MB each. New photos are saved with the laptop when you click Save.</p>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Videos</h2><span className="text-sm text-muted">{videos.length}/3</span></div>
          {videos.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {videos.map((v, i) => (
                <li key={v.url} className="relative overflow-hidden rounded-xl border border-line bg-black">
                  <video src={v.url} controls preload="metadata" playsInline className="aspect-video w-full" aria-label={`Video ${i + 1}`} />
                  <button type="button" onClick={() => setVideos((p) => p.filter((_, n) => n !== i))} aria-label={`Remove video ${i + 1}`} className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-destructive"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" variant="outline" size="sm" disabled={uploadingVideo || videos.length >= 3} onClick={() => videoRef.current?.click()}>{uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}{uploadingVideo ? "Uploading…" : "Add video"}</Button>
          <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" multiple hidden onChange={(e) => uploadVideos(e.target.files)} />
          <p className="text-xs text-muted">MP4, WebM or MOV, up to 60 MB each. Videos appear in the product gallery after the photos.</p>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Publishing schedule</h2><ScheduleBadge state={state} /></div>
          <ScheduleFields start={publishAt} end={unpublishAt} onStart={setPublishAt} onEnd={setUnpublishAt} startLabel="Publish on" endLabel="Unpublish on" error={scheduleError} />
          <p className="text-xs text-muted">While scheduled or expired, the laptop is hidden from the store, search, popups and checkout. &quot;Visible in store&quot; must also be on.</p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">SEO</h2>
          <Field label="Search title" error={errors.seoTitle?.message} hint="Optional. Defaults to the product name."><Input maxLength={70} {...register("seoTitle")} /></Field>
          <Field label="Search description" error={errors.seoDescription?.message} hint="Optional. Defaults to an automatic summary of the specs."><Textarea rows={3} maxLength={180} {...register("seoDescription")} /></Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4 p-6 xl:sticky xl:top-24">
          <h2 className="text-lg font-semibold">Pricing & stock</h2>
          <Field label="Price (Rs.)" error={errors.price?.message}><Input inputMode="numeric" aria-invalid={!!errors.price} {...register("price")} /></Field>
          <Field label="Discounted price (Rs.)" error={errors.discountPrice?.message} hint="Leave empty for no discount"><Input inputMode="numeric" aria-invalid={!!errors.discountPrice} {...register("discountPrice")} /></Field>
          <Field label="Units in stock" error={errors.stock?.message} hint="Set to 0 to mark as out of stock"><Input inputMode="numeric" aria-invalid={!!errors.stock} {...register("stock")} /></Field>
          <div className="space-y-3 border-t border-line pt-4">
            {([["isActive", "Visible in store"], ["isFeatured", "Featured on homepage"], ["isLatest", "Latest arrival"]] as const).map(([name, label]) => (
              <Controller key={name} control={control} name={name} render={({ field }) => (
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">{label}<Switch checked={!!field.value} onCheckedChange={field.onChange} aria-label={label} /></label>
              )} />
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="icon" aria-label="Preview laptop" onClick={() => setShowPreview(true)}><Eye className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/admin/products")}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || uploading || uploadingVideo}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{product ? "Save changes" : "Add laptop"}</Button>
          </div>
        </Card>
      </div>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent title="Laptop preview" className="max-w-md">
          {showPreview && (() => {
            const v = getValues(); const price = Number(v.price) || 0; const sale = Number(v.discountPrice) || 0;
            return (
              <div className="space-y-3">
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {images[0] ? <img src={images[0].url} alt="" className="h-full w-full object-contain p-2" /> : <div className="grid h-full place-items-center text-sm text-muted">No photo yet</div>}
                </div>
                <div className="flex flex-wrap gap-1.5"><Badge tone="blue">{conditionLabel[v.condition]}</Badge><ScheduleBadge state={state} />{videos.length > 0 && <Badge tone="neutral">{videos.length} video{videos.length > 1 ? "s" : ""}</Badge>}</div>
                <p className="text-xs font-medium text-brand">{v.brand}</p>
                <h3 className="font-heading text-xl font-bold">{v.name || "Product name"}</h3>
                <p className="text-sm text-muted">{[v.processor, v.ram, v.storage].filter(Boolean).join(" · ")}</p>
                <p className="price text-2xl font-bold">{formatPKR(sale && sale < price ? sale : price)} {sale && sale < price ? <span className="text-sm font-normal text-muted line-through">{formatPKR(price)}</span> : null}</p>
                <p className="text-xs text-muted">Preview only. Save to apply changes.</p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </form>
  );
}
