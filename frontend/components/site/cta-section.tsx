import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "./whatsapp-button";
import { Reveal } from "@/components/ui/reveal";
import { getHome } from "@/lib/cms";

/** Bottom call-to-action. Text and button come from the homepage "cta" section in the CMS. */
export async function CtaSection() {
  const home = await getHome();
  const cta = home?.doc.sections.find((s) => s.id === "cta");
  if (cta && !cta.enabled) return null;
  const title = cta?.title || "Ready to Find Your Next Laptop?";
  const text = cta?.text ?? "Browse the collection, or message us on WhatsApp and we will help you pick one that fits your work and budget.";
  return (
    <section className="relative overflow-hidden bg-navy py-20 text-white">
      <div className="blueprint absolute inset-0" aria-hidden />
      <div className="absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full bg-brand/30 blur-[110px]" aria-hidden />
      <div className="container relative"><Reveal className="max-w-3xl">
        <h2 className="text-3xl font-bold text-white sm:text-5xl">{title}</h2>
        {text && <p className="mt-4 max-w-xl text-lg text-white/70">{text}</p>}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {(cta?.buttonLabel ?? "Explore Collection") && <Button asChild size="lg"><Link href={cta?.buttonHref || "/shop"}>{cta?.buttonLabel || "Explore Collection"}</Link></Button>}
          <WhatsAppButton size="lg" label="Chat on WhatsApp" message="Hello Rizvi Laptops, I need help choosing a laptop." />
        </div>
      </Reveal></div>
    </section>
  );
}
