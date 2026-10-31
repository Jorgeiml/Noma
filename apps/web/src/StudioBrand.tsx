/** Local vector identity: no fonts, assets or requests from external providers. */
export function StudioMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M10 29V13c0-7 9-7 10 0l1 14c1 5 9 5 9-1V11"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
/** Brisa is decorative, without business actions or implied AI capabilities. */
export function StudioCompanion({
  mood = "calm",
}: {
  mood?: "calm" | "waiting" | "welcome";
}) {
  return (
    <svg
      className={`studio-companion companion-${mood}`}
      viewBox="0 0 128 124"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="companion-ground" cx="64" cy="110" rx="28" ry="4" />
      <g className="companion-body">
        <path
          className="companion-outline"
          d="M39 29h46a15 15 0 0 1 15 15v42a15 15 0 0 1-15 15H39a15 15 0 0 1-15-15V44a15 15 0 0 1 15-15Z"
        />
        <path
          className="companion-silhouette"
          d="M44 21h40a14 14 0 0 1 14 14v44a14 14 0 0 1-14 14H44a14 14 0 0 1-14-14V35a14 14 0 0 1 14-14Z"
        />
        <path
          className="companion-light"
          d="M41 43v-7c0-3 2-4 5-4h11"
          strokeLinecap="round"
        />
        <g className="companion-face" strokeLinecap="round">
          <path d="M53 55v4m22-4v4m-18 12c4 3 10 3 14 0" />
        </g>
      </g>
    </svg>
  );
}
