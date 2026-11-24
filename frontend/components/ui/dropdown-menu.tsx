"use client";
import * as D from "@radix-ui/react-dropdown-menu";
import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = D.Root;
export const DropdownMenuTrigger = D.Trigger;

export const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof D.Content>, React.ComponentPropsWithoutRef<typeof D.Content>>(
  ({ className, sideOffset = 8, collisionPadding = 12, ...props }, ref) => (
    <D.Portal>
      <D.Content ref={ref} sideOffset={sideOffset} collisionPadding={collisionPadding}
        className={cn("z-[60] min-w-[14rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-line bg-white p-1.5 text-sm text-ink shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-100", className)} {...props} />
    </D.Portal>
  ),
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof D.Item>, React.ComponentPropsWithoutRef<typeof D.Item>>(
  ({ className, ...props }, ref) => (
    <D.Item ref={ref} className={cn("relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none transition-colors data-[highlighted]:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props} />
  ),
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted", className)} {...props} />;
export const DropdownMenuSeparator = ({ className }: { className?: string }) => <D.Separator className={cn("-mx-1.5 my-1.5 h-px bg-line", className)} />;
