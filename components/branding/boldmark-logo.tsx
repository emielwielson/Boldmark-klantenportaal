import Image from "next/image";
import Link from "next/link";

type BoldmarkLogoProps = {
  className?: string;
};

/**
 * Target ~195×28px wordmark (marketing site). The asset is a 500×500 square with the
 * wordmark only in a horizontal band near the vertical center. `object-contain` scales
 * the whole square, so that band shrinks to ~10px tall — use `object-cover` + a short
 * wide box so the viewport is that band, scaled to full width.
 */
export function BoldmarkLogo({ className = "" }: BoldmarkLogoProps) {
  return (
    <Link
      href="/dashboard"
      className={`relative inline-block h-[28px] w-[195px] max-w-[calc(100vw-2rem)] shrink-0 sm:h-[30px] ${className}`}
      aria-label="Boldmark — naar dashboard"
    >
      <Image
        src="/boldmark-logo.png"
        alt="Boldmark"
        fill
        className="object-cover object-center"
        sizes="195px"
        priority
      />
    </Link>
  );
}
