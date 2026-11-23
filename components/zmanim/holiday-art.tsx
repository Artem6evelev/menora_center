import type { HolidayArt } from "@/lib/zmanim/holiday-catalog";

/** Original inline artwork: crisp on a 4K display, no third-party image requests. */
export default function HolidayArtwork({ art }: { art: HolidayArt }) {
  const drawing = (() => {
    switch (art) {
      case "willow":
        return (
          <>
            <path d="M40 116Q65 69 45 14M65 116Q77 63 70 10M85 116Q91 74 102 24" />
            {[
              [45, 25],
              [50, 47],
              [54, 69],
              [72, 24],
              [74, 49],
              [73, 73],
              [98, 39],
              [94, 60],
              [90, 83],
            ].map(([x, y]) => (
              <g key={x + ":" + y}>
                <path
                  d={`M${x} ${y}Q${x - 25} ${y - 13} ${x - 21} ${y + 7}Q${x - 5} ${y + 13} ${x} ${y}`}
                  fill="currentColor"
                  fillOpacity=".17"
                />
                <path
                  d={`M${x} ${y + 4}Q${x + 23} ${y - 10} ${x + 20} ${y + 11}Q${x + 7} ${y + 15} ${x} ${y + 4}`}
                  fill="currentColor"
                  fillOpacity=".1"
                />
              </g>
            ))}
          </>
        );
      case "waters":
        return (
          <>
            <path d="M58 117L64 55L70 117M15 41Q34 26 49 41M79 41Q97 26 114 41M10 62Q31 47 50 62M78 62Q98 47 118 62M7 84Q29 69 49 84M79 84Q101 69 121 84M7 106Q28 91 46 106M82 106Q102 91 121 106M64 10V24M43 17L49 28M85 17L79 28" />
            <path d="M49 41A16 16 0 0 1 79 41" />
          </>
        );
      case "chanukiah":
        return (
          <>
            {[16, 30, 44, 54, 74, 84, 98, 112].map((x, i) => (
              <g key={x}>
                <path
                  d={`M${x} 51 V${70 + Math.abs(3.5 - i) * 4} Q${x} 101 64 101`}
                />
                <path
                  d={`M${x} 44 C${x - 7} 38 ${x - 3} 33 ${x} 28 C${x + 6} 34 ${x + 7} 39 ${x} 44Z`}
                  fill="currentColor"
                  stroke="none"
                />
              </g>
            ))}
            <path d="M64 36V116M47 117H81M56 123H72" />
            <path
              d="M64 29C55 21 61 16 64 9C72 18 73 23 64 29Z"
              fill="currentColor"
              stroke="none"
            />
          </>
        );
      case "shofar":
        return (
          <>
            <path
              d="M17 101C29 70 59 77 77 48C85 34 91 17 110 15L116 29C98 35 100 63 82 81C62 101 40 89 29 113Z"
              fill="currentColor"
              fillOpacity=".15"
            />
            <path d="M23 105C40 82 65 92 85 69M78 45L91 52M88 30L101 38M16 105L31 115" />
            <circle cx="29" cy="34" r="15" />
            <path d="M29 19L33 12M26 19L18 11" />
          </>
        );
      case "sukkah":
        return (
          <>
            <path d="M17 115V49H111V115M31 50V115M98 50V115M17 78H31M98 78H111M56 115V69H77V115" />
            <path d="M12 48L116 43M16 40L108 35M25 33L104 27M29 42L34 26M53 40L59 22M78 36L84 20M101 32L106 18" />
            <path d="M45 13Q45 34 29 42M66 13Q68 31 55 40M93 13Q96 28 79 36" />
          </>
        );
      case "purim":
        return (
          <>
            <path d="M29 25H99V108H29ZM29 38H99M29 96H99M23 14V119M105 14V119M17 15H29M99 15H111M17 119H29M99 119H111M44 53H83M44 64H74M44 75H83M44 86H66" />
            <path d="M48 20L64 8L80 20" fill="currentColor" fillOpacity=".2" />
          </>
        );
      case "matzah":
        return (
          <>
            <circle
              cx="64"
              cy="64"
              r="48"
              fill="currentColor"
              fillOpacity=".1"
            />
            {[36, 50, 64, 78, 92].flatMap((y) =>
              [36, 50, 64, 78, 92]
                .filter((x) => (x - 64) ** 2 + (y - 64) ** 2 < 1600)
                .map((x) => (
                  <circle
                    key={`${x}-${y}`}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="currentColor"
                    stroke="none"
                  />
                )),
            )}
            <path d="M23 39L106 89M21 70L93 112M47 17L111 56" opacity=".45" />
          </>
        );
      case "tablets":
        return (
          <>
            <path
              d="M15 111V41A25 25 0 0 1 64 41V111ZM64 111V41A25 25 0 0 1 113 41V111Z"
              fill="currentColor"
              fillOpacity=".1"
            />
            {[49, 61, 73, 85, 97].map((y) => (
              <path key={y} d={`M30 ${y}H49M79 ${y}H98`} />
            ))}
            <path d="M64 12V4M43 13L38 5M85 13L90 5" />
          </>
        );
      case "tree":
        return (
          <>
            <path d="M64 110V43M64 68L37 48M64 80L93 57M51 116H77" />
            <path
              d="M64 20C29 -1 10 27 29 49C7 63 22 94 48 88C55 102 77 102 86 86C114 95 128 61 106 47C124 20 90 1 73 21Z"
              fill="currentColor"
              fillOpacity=".12"
            />
            <circle cx="39" cy="39" r="5" />
            <circle cx="89" cy="40" r="5" />
            <circle cx="39" cy="70" r="5" />
            <circle cx="94" cy="73" r="5" />
          </>
        );
      case "bonfire":
        return (
          <>
            <path
              d="M65 12C72 40 103 44 99 74C96 106 31 108 28 77C25 58 44 41 46 28C57 35 60 47 59 56C77 46 61 30 65 12Z"
              fill="currentColor"
              fillOpacity=".18"
            />
            <path d="M64 55C70 71 83 75 78 90C68 108 44 90 50 79ZM28 116L99 103M29 103L99 116" />
          </>
        );
      case "heart":
        return (
          <path
            d="M64 109L20 65C-7 36 30 2 56 29L64 37L72 29C99 2 135 36 108 65Z"
            fill="currentColor"
            fillOpacity=".12"
          />
        );
      case "rings":
        return (
          <>
            <circle cx="46" cy="76" r="28" />
            <circle cx="82" cy="76" r="28" />
            <path
              d="M42 42L32 30L46 16L60 30L50 42M78 42L68 30L82 16L96 30L86 42M32 30H60M68 30H96"
              fill="currentColor"
              fillOpacity=".12"
            />
          </>
        );
      case "moon":
        return (
          <>
            <path
              d="M88 19A49 49 0 1 0 110 83A43 43 0 0 1 88 19Z"
              fill="currentColor"
              fillOpacity=".15"
            />
            <path d="M98 21V39M89 30H107M109 51V63M103 57H115" />
          </>
        );
      case "sunrise":
        return (
          <>
            <path d="M12 91H116M21 105H107M31 117H97M30 89A34 34 0 0 1 98 89M64 14V34M23 32L37 47M105 32L91 47M9 61L29 68M119 61L99 68" />
            <path d="M48 72L64 56L80 72M64 57V89" />
          </>
        );
      case "candle":
        return (
          <>
            <path
              d="M48 61H80V113H48ZM41 117H87M64 60V50"
              fill="currentColor"
              fillOpacity=".1"
            />
            <path
              d="M64 11C77 29 85 37 73 47C60 59 43 44 51 32C57 23 64 21 64 11Z"
              fill="currentColor"
              fillOpacity=".5"
            />
            <path d="M64 30C69 39 68 43 64 47" />
          </>
        );
      case "prayer":
        return (
          <>
            <path d="M16 34Q40 17 64 34Q88 17 112 34V107Q88 92 64 107Q40 92 16 107ZM64 35V106M29 48Q42 41 52 47M29 62Q42 55 52 61M77 47Q89 41 99 48M77 61Q89 55 99 62M29 76Q42 69 52 75M77 75Q89 69 99 76" />
            <path d="M42 16L48 7M86 16L80 7" />
          </>
        );
      case "torah":
        return (
          <>
            <path d="M30 28Q64 12 98 28V104Q64 88 30 104ZM22 18V116M106 18V116M15 18H29M99 18H113M15 116H29M99 116H113M43 42Q64 34 85 42M43 56Q64 48 85 56M43 70Q64 62 85 70M43 84Q64 76 85 84" />
            <path d="M46 16L38 5L55 10L64 2L73 10L90 5L82 16" />
          </>
        );
      case "book":
        return (
          <>
            <path
              d="M23 30H105V107H23ZM23 95H105M32 30V94M39 45H91M39 57H84M39 69H91M39 81H73M34 107V117L45 110L56 117V107"
              fill="currentColor"
              fillOpacity=".1"
            />
            <path
              d="M45 21L36 9L55 15L64 5L73 15L92 9L83 21Z"
              fill="currentColor"
              fillOpacity=".4"
            />
          </>
        );
    }
  })();
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-holiday-art={art}
    >
      {drawing}
    </svg>
  );
}
