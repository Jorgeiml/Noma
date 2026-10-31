import { Nomi } from "./Nomi";

export function PlanCharacter({
  scene,
}: {
  scene: "shop" | "beach" | "space";
}) {
  if (scene === "beach")
    return <Nomi mood="beach" className="noma-plan-scene" />;
  return (
    <svg
      className="noma-plan-scene"
      viewBox="0 0 500 560"
      width="500"
      height="560"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {scene === "shop" ? (
        <g strokeLinejoin="round">
          <rect
            x="56"
            y="106"
            width="390"
            height="390"
            rx="18"
            fill="#f3ead8"
          />
          <rect
            x="88"
            y="180"
            width="90"
            height="130"
            rx="8"
            fill="#e1e8d6"
            stroke="#b4c0a0"
            strokeWidth="5"
          />
          <path d="M133 180v130m-45-65h90" stroke="#b4c0a0" strokeWidth="4" />
        </g>
      ) : (
        <g>
          <ellipse
            cx="255"
            cy="302"
            rx="204"
            ry="175"
            transform="rotate(-25 255 302)"
            stroke="#b6c2cd"
            strokeWidth="3"
            strokeDasharray="6 10"
          />
          <path
            d="m80 130 5-18 5 18 18 5-18 5-5 18-5-18-18-5Zm340 245 5-16 5 16 16 5-16 5-5 16-5-16-16-5Z"
            fill="#c6a563"
          />
          <circle cx="96" cy="380" r="25" fill="#d9ddec" />
          <ellipse
            cx="96"
            cy="380"
            rx="43"
            ry="10"
            transform="rotate(-28 96 380)"
            stroke="#9ba9bb"
            strokeWidth="5"
          />
          <circle cx="405" cy="106" r="20" fill="#e8cf90" />
        </g>
      )}
      <g
        transform={scene === "shop" ? "translate(40 12) scale(.85)" : undefined}
      >
        {scene === "space" && (
          <rect
            x="118"
            y="302"
            width="54"
            height="127"
            rx="22"
            fill="#aebdcb"
            stroke="#677b90"
            strokeWidth="5"
          />
        )}
        <Nomi />
        {scene === "space" && (
          <g strokeLinejoin="round">
            <path
              d="M177 341q50 17 108-2l31 74q-38 61-108 36Z"
              fill="#f0f2ed"
              stroke="#889aa8"
              strokeWidth="5"
            />
            <rect
              x="216"
              y="361"
              width="62"
              height="43"
              rx="10"
              fill="#c3d2db"
              stroke="#8298a7"
              strokeWidth="4"
            />
            <circle cx="234" cy="382" r="6" fill="#dd7950" />
            <circle cx="258" cy="382" r="6" fill="#6f907c" />
            <ellipse
              cx="282"
              cy="243"
              rx="161"
              ry="131"
              fill="#d5e8f0"
              fillOpacity=".12"
              stroke="#9eb4c3"
              strokeWidth="9"
            />
            <path
              d="M144 202q10-52 59-66m-65 91 1-6"
              stroke="#fffdf3"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M168 329q86 70 190-2"
              stroke="#f6f7ef"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M168 329q86 70 190-2"
              stroke="#899eac"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
      {scene === "shop" && (
        <g strokeLinejoin="round">
          <path
            d="M56 121V95q0-13 14-13h363q13 0 13 13v26Z"
            fill="#a3b48a"
            stroke="#7e9368"
            strokeWidth="4"
          />
          <path
            d="M56 121v25q24 25 49 0 24 25 49 0 24 25 49 0 24 25 49 0 24 25 49 0 24 25 49 0 24 25 49 0 23 25 47 0v-25Z"
            fill="#f6f0dc"
          />
          <path
            d="M105 121v25q24 25 49 0v-25m49 0v25q24 25 49 0v-25m49 0v25q24 25 49 0v-25m49 0v25q23 25 47 0v-25"
            fill="#a3b48a"
          />
          <path d="M65 153v348m372-348v348" stroke="#8a9b75" strokeWidth="7" />
          <rect
            x="56"
            y="355"
            width="390"
            height="147"
            rx="12"
            fill="#d5bc91"
            stroke="#ae9169"
            strokeWidth="5"
          />
          <path
            d="M48 355h406"
            stroke="#846f50"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <rect
            x="184"
            y="393"
            width="132"
            height="62"
            rx="16"
            fill="#f5ecda"
          />
          <path
            d="M223 434v-21c0-9 12-9 15 0l2 15c2 9 15 9 15 0v-21"
            stroke="#82956b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M332 306h67v31h-67Z"
            fill="#fff9e9"
            stroke="#8a9b75"
            strokeWidth="4"
          />
          <path
            d="m345 308 7 7 17-16"
            stroke="#6d8458"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
