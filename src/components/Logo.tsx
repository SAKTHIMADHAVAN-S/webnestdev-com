import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  lightMode?: boolean;
}

export default function Logo({ size = 42, showText = true, className = "", lightMode = true }: LogoProps) {
  return (
    <div id="webnest-brand-logo" className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-fidelity custom SVG reproducing the overlapping double-W teal wing emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        {/* Drop shadow filter for premium depth */}
        <defs>
          <filter id="logo-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0D9488" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#logo-shadow)">
          {/* Wing/Check 1 (Left Back Layer) */}
          <path
            d="M25 25 L45 25 L62 70 L47 70 Z"
            fill="#0F766E"
          />
          {/* Wing/Check 2 (Middle Offset Overlap) */}
          <path
            d="M40 25 L60 25 L75 70 L60 70 Z"
            fill="#0D9488"
          />
          {/* Wing/Check 3 (Right Front Layer) */}
          <path
            d="M55 25 L75 25 L88 70 L73 70 Z"
            fill="#14B8A6"
          />
          
          {/* Interlocking overlay line detailing to form the clean double-W */}
          <path
            d="M40 25 L55 58 L70 25"
            stroke={lightMode ? "#F9FAFB" : "#111827"}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <path
            d="M55 25 L68 55 L81 25"
            stroke={lightMode ? "#F9FAFB" : "#111827"}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span 
            className={`font-semibold tracking-[0.14em] text-lg uppercase ${
              lightMode ? "text-gray-950" : "text-white"
            }`} 
            style={{ 
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              letterSpacing: "0.15em"
            }}
          >
            WEB
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className={`h-[1px] w-2 ${lightMode ? "bg-gray-300" : "bg-gray-600"}`} />
            <span 
              className={`text-[9px] font-bold tracking-[0.4em] uppercase ${
                lightMode ? "text-gray-500" : "text-gray-450"
              }`}
              style={{ fontFamily: "'JetBrains Mono', 'Inter', monospace" }}
            >
              NEST
            </span>
            <div className={`h-[1px] w-2 ${lightMode ? "bg-gray-300" : "bg-gray-600"}`} />
          </div>
        </div>
      )}
    </div>
  );
}
