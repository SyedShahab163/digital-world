"use client";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useSite } from "@/components/settings-provider";
import { whatsappUrl } from "@/lib/utils";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M16.04 3C9.4 3 4 8.38 4 15c0 2.12.56 4.19 1.62 6.01L4 29l8.2-2.15A12.05 12.05 0 0 0 16.04 27C22.68 27 28 21.62 28 15S22.68 3 16.04 3Zm0 21.97c-1.8 0-3.56-.48-5.1-1.4l-.37-.22-4.87 1.28 1.3-4.74-.24-.38A9.9 9.9 0 0 1 6.1 15c0-5.46 4.46-9.9 9.94-9.9S25.9 9.54 25.9 15s-4.4 9.97-9.86 9.97Zm5.45-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07a8.1 8.1 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

interface Props extends Omit<ButtonProps, "asChild"> { message?: string; label?: string; iconOnly?: boolean }

/** Opens a wa.me click-to-chat link with an optional pre-filled message. */
export function WhatsAppButton({ message, label = "Chat on WhatsApp", iconOnly, children, ...props }: Props) {
  const { settings } = useSite();
  const href = whatsappUrl(settings.contact_whatsapp || settings.contact_phone, message);
  return (
    <Button asChild variant="whatsapp" {...props}>
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>
        <WhatsAppIcon className="h-[18px] w-[18px]" />
        {!iconOnly && (children ?? label)}
      </a>
    </Button>
  );
}
