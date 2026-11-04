import { useEffect, useId, useRef, useState } from "react";
export type NomiMood =
  | "welcome"
  | "listening"
  | "thinking"
  | "confirm"
  | "celebrate"
  | "energized"
  | "rest"
  | "beach";
export function Nomi({
  mood = "welcome",
  className = "",
  scene = null,
  uniform = false,
}: {
  mood?: NomiMood;
  uniform?: boolean;
  scene?: "mirror" | "brush" | "weight" | "tool" | null;
  className?: string;
}) {
  const outfit = uniform && scene ? {
    mirror: ["#263b41", "#dfab70"],
    brush: ["#e8f8f4", "#36776e"],
    weight: ["#693c72", "#f4b558"],
    tool: ["#304f73", "#f5bd66"],
  }[scene] : null;
  const id = useId().replaceAll(":", "");
  const ref = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () =>
      setActive(inView && !document.hidden && !media?.matches);
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[0]?.isIntersecting ?? false;
              update();
            },
            { threshold: 0.15 },
          )
        : null;
    if (ref.current) observer?.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    media?.addEventListener("change", update);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      media?.removeEventListener("change", update);
    };
  }, []);
  return (
    <svg
      ref={ref}
      className={`nomi ${className}`}
      data-mood={mood}
      data-scene={scene ?? undefined}
      data-active={active}
      viewBox="0 0 500 560"
      fill="none"
      aria-hidden="true"
      focusable="false"
      width="500"
      height="560"
    >
      <defs>
        <linearGradient
          id={`${id}-body`}
          x1="166"
          y1="139"
          x2="355"
          y2="480"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffad5c" />
          <stop offset=".43" stopColor="#f67b39" />
          <stop offset="1" stopColor="#cd4a25" />
        </linearGradient>
        <linearGradient
          id={`${id}-tail`}
          x1="77"
          y1="218"
          x2="170"
          y2="390"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ed7135" />
          <stop offset="1" stopColor="#a83820" />
        </linearGradient>
        <linearGradient
          id={`${id}-belly`}
          x1="202"
          y1="294"
          x2="290"
          y2="465"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffd4a3" />
          <stop offset="1" stopColor="#f69554" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#2a271e" stopOpacity=".15" />
          <stop offset="1" stopColor="#2a271e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {mood === "energized" && (
        <g className="nomi-energy" strokeLinecap="round">
          <ellipse
            cx="248"
            cy="303"
            rx="186"
            ry="205"
            fill="#ffe4ae"
            fillOpacity=".65"
          />
          <ellipse
            cx="248"
            cy="303"
            rx="163"
            ry="185"
            stroke="#edb24d"
            strokeWidth="2"
            strokeDasharray="6 18"
          />
          <path
            d="m91 224-21-18m50-65-11-28m75 6-2-30m149 49 18-27m48 84 29-11m-12 97 27 3M86 355l-26 13m335 39 24 17"
            stroke="#b85825"
            strokeWidth="6"
          />
          <path
            d="m108 165 6 14 15 6-15 6-6 14-6-14-15-6 15-6Zm282 142 7 17 18 7-18 7-7 17-7-17-18-7 18-7Z"
            fill="#da8034"
          />
        </g>
      )}
      {mood === "beach" && (
        <g>
          <ellipse cx="248" cy="501" rx="185" ry="25" fill="#ead6ad" />
          <circle cx="100" cy="140" r="26" fill="#f3b75d" />
          <path
            d="M390 166v298"
            stroke="#83725b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M318 170q72-125 144 0c-25-12-47-12-72 0-24-12-48-12-72 0Z"
            fill="#9aac7b"
          />
          <path
            d="M390 76q-30 40-24 88m24-88q30 40 24 88"
            stroke="#f7f4dd"
            strokeWidth="9"
          />
        </g>
      )}
      <ellipse cx="248" cy="505" rx="175" ry="27" fill={`url(#${id}-shadow)`} />
      <g className="nomi-body">
        <path
          className="nomi-tail"
          d="M166 382C87 408 43 359 54 295c6-37 26-64 44-59 20 6 9 30 4 53-7 31 15 48 48 36l16 57Z"
          fill={`url(#${id}-tail)`}
        />
        <path
          d="M180 445c-11 12-26 33-20 46 4 10 29 10 47 2l18-31-45-17Zm94 13c-1 20 3 42 17 46 12 4 39-1 43-11 4-11-11-28-22-38l-38 3Z"
          fill="#bd4828"
        />
        <path
          d="M178 455c-70-32-70-111-35-168 24-39 2-84 24-123 24-42 78-32 100-3 28 37 34 56 64 54 35-3 67-38 74-68 32-1 45 43 17 83-26 41-80 52-103 82-17 24 2 55 25 78 32 33 7 80-35 87-40 11-83-4-131-22Z"
          fill={`url(#${id}-body)`}
        />
        <path
          d="M303 302c-27-2-68 15-88 51-18 33-20 71 2 96 18 20 61 31 89 16 28-15 26-44 11-67-23-34-41-59-14-96Z"
          fill={`url(#${id}-belly)`}
        />
        {outfit && (
          <g className="nomi-uniform">
            <path
              d="M182 327q45 23 115 1c-5 24 17 43 37 66 24 26 10 65-26 76-43 12-92-2-129-20-30-15-44-46-43-83z"
              fill={outfit[0]}
            />
            <path
              d={scene === "mirror" || scene === "tool"
                ? "M182 326l20 39h77l18-37M138 401q90 35 195-5"
                : "M197 335l36 37 43-35"}
              fill="none"
              stroke={outfit[1]}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="247" y="402" width="40" height="31" rx="7" fill={outfit[1]} />
            <path
              d="M257 412v11m0-9 9 7v-9m5 10v-10l7 7v-7"
              fill="none"
              stroke={outfit[0]}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}
        <path
          d="M177 211c-1-37 16-54 38-53"
          stroke="#ffd8a5"
          strokeWidth="12"
          strokeLinecap="round"
          opacity=".7"
        />
        <path
          d="M328 239c41-1 63-22 79-48"
          stroke="#ffc487"
          strokeWidth="8"
          strokeLinecap="round"
          opacity=".6"
        />
        <g className="nomi-face">
          <g className="nomi-eyes">
            <ellipse cx="211" cy="259" rx="6" ry="10" fill="#362b26" />
            <ellipse cx="258" cy="261" rx="6" ry="10" fill="#362b26" />
            <circle cx="213" cy="256" r="2" fill="#fff0db" />
            <circle cx="260" cy="258" r="2" fill="#fff0db" />
          </g>
          <path
            className="nomi-closed-eyes"
            d="M202 262q9-9 18 0m29 0q9-9 18 0"
            stroke="#362b26"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            className="nomi-brows"
            d="M201 236q10-6 20-1m26 1q10-5 20 2"
            stroke="#a94624"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            className="nomi-smile"
            d="M223 286q12 12 25-1"
            stroke="#713921"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {mood === "energized" && (
            <g>
              <path d="M218 281q18 5 37 0c-1 28-34 34-37 0Z" fill="#713921" />
              <path
                d="M226 300q10-9 21-2"
                stroke="#f5a283"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <ellipse
                cx="196"
                cy="279"
                rx="9"
                ry="4"
                fill="#d94e26"
                fillOpacity=".35"
              />
              <ellipse
                cx="273"
                cy="280"
                rx="9"
                ry="4"
                fill="#d94e26"
                fillOpacity=".35"
              />
            </g>
          )}
          {mood === "beach" && (
            <g stroke="#30382f" strokeWidth="5" strokeLinejoin="round">
              <path
                d="M191 247h34l-3 20q-14 10-27-1Zm51 0h34l-4 20q-14 10-27-1Z"
                fill="#303d3b"
              />
              <path d="M225 251q8-7 17 0m-51-4-11-5m96 5 10-4" fill="none" />
              <path
                d="m200 251 11 9m40-9 11 9"
                stroke="#91b7ae"
                strokeWidth="3"
              />
            </g>
          )}
          <ellipse
            className="nomi-thought-mouth"
            cx="235"
            cy="289"
            rx="5"
            ry="7"
            fill="#713921"
          />
        </g>
        <path
          className="nomi-arm-left"
          d="M153 331c-26-12-40 8-27 28 8 12 25 17 40 10"
          fill="#e66a31"
          stroke="#cd552b"
          strokeWidth="2"
        />
        <g className="nomi-hand">
          {scene && (
            <g
              className="nomi-accessory"
              stroke="#3d3d37"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {scene === "mirror" && (
                <>
                  <path d="m373 297 19-42" strokeWidth="9" />
                  <ellipse
                    cx="401"
                    cy="235"
                    rx="23"
                    ry="29"
                    transform="rotate(23 401 235)"
                    fill="#c4a08f"
                  />
                  <ellipse
                    cx="401"
                    cy="235"
                    rx="17"
                    ry="23"
                    transform="rotate(23 401 235)"
                    fill="#e8f0ed"
                  />
                  <path d="m395 238 13-16" stroke="#fff" />
                </>
              )}
              {scene === "brush" && (
                <>
                  <path d="m373 299 39-56" stroke="#235e52" strokeWidth="11" />
                  <path d="m402 250-13-10 15-20 13 10z" fill="#d4efea" />
                  <path
                    d="m392 236 10 8m-6-14 10 8"
                    stroke="#588e83"
                    strokeWidth="2"
                  />
                </>
              )}
              {scene === "weight" && (
                <g transform="rotate(-24 378 284)">
                  <path d="M349 282h58" strokeWidth="9" />
                  <rect
                    x="343"
                    y="266"
                    width="15"
                    height="32"
                    rx="5"
                    fill="#bb644b"
                  />
                  <rect
                    x="397"
                    y="266"
                    width="15"
                    height="32"
                    rx="5"
                    fill="#bb644b"
                  />
                </g>
              )}
              {scene === "tool" && (
                <>
                  <path
                    d="m373 298 35-44-8-12 5-16 9 13 10 2 11-10-3 17-14 10-34 47z"
                    fill="#aebfcc"
                  />
                  <path d="m382 291 21-29" stroke="#ecf4f9" />
                </>
              )}
            </g>
          )}
          <path
            d="M315 339c25-7 38-28 45-45 7-16 24-12 24 3 1 30-22 65-51 72"
            fill="#f68b46"
            stroke="#de6b33"
            strokeWidth="2"
          />
          <path
            d="m368 294 6-12m-3 21 14-3"
            stroke="#ffbc7a"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </g>
      <g
        className="nomi-celebration"
        stroke="#a44428"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="m101 160-9-14m28-5 1-14m248-24 10-13m-1 46 17-2" />
        <circle cx="96" cy="194" r="4" fill="#ef9153" stroke="none" />
        <circle cx="373" cy="72" r="5" fill="#ef9153" stroke="none" />
      </g>
    </svg>
  );
}
