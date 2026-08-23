"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  domain: string;
  size?: "sm" | "md" | "lg";
};

const BOX = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-12 w-12 rounded-xl",
  lg: "h-14 w-14 rounded-xl",
} as const;

const GLYPH = { sm: "text-sm", md: "text-lg", lg: "text-xl" } as const;

export default function Favicon({ src, domain, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={`${BOX[size]} grid shrink-0 place-items-center overflow-hidden border border-line bg-surface-2`}
    >
      {showImage ? (
        // Arbitrary third-party hosts — next/image would need every domain allowlisted.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`${GLYPH[size]} font-bold text-muted`}>
          {domain.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
