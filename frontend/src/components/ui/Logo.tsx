"use client";
import Link from "next/link";
import { useId } from "react";

export function LogoMark({ size = 32 }: { size?: number }) {
  // Unique id: a gradient defined in a hidden SVG (e.g. the display:none mobile header)
  // would otherwise break every other logo on the page, notably in Safari.
  const id = `awg-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M20 2.5 35 8.5v10.2c0 9.4-6.3 16.6-15 18.8C11.3 35.3 5 28.1 5 18.7V8.5L20 2.5Z" fill={`url(#${id})`} opacity=".16" stroke={`url(#${id})`} strokeWidth="1.6" />
      <path d="M12.5 26.5 20 11l7.5 15.5M15.4 21h9.2" fill="none" stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="11" r="2.2" fill="#22d3ee" />
    </svg>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-ink-100" aria-label="Artificial Wisdom home">
      <LogoMark />
      {!compact && (
        <span className="h-display text-[17px] font-semibold leading-none">
          Artificial <span className="text-gradient">Wisdom</span>
        </span>
      )}
    </Link>
  );
}
