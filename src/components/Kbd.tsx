import { cn } from "$/lib";
import type { ReactNode } from "react";

export default function Kbd({
  className,
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <kbd
      {...props}
      className={cn(
        "h-5 max-w-fit transition-all rounded-md px-1.5 flex items-center gap-0.5 text-xs font-bold text-white-100 border border-grey-100/20 group-hover:border-grey-100/30 group-hover:bg-grey-800/50",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
