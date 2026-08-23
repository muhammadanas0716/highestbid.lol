import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon. Rendered as inline SVG rather than text so it needs no
 * font — and edge to edge, since iOS applies its own corner rounding.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#C6F24E",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g
            fill="none"
            stroke="#0A0A0C"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M43.5 23.5c0-6-5.2-9.5-11.5-9.5s-11.5 3.5-11.5 9c0 5.6 5.2 8 11.5 9.8s11.5 4.2 11.5 9.7c0 5.6-5.2 9.5-11.5 9.5s-11.5-3.5-11.5-9.5" />
            <path d="M32 8.5v47" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
