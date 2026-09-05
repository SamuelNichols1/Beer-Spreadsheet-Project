import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import BeerTypeIcon from "../components/BeerTypeIcon";

const USERS_LIST_KEY = "usersList";

const BEVERAGE_CONFIG = {
  beer: {
    key: "beer",
    label: "Beer",
    plural: "beers",
    emoji: "🍺",
    accent: "#6f5ef5",
    listKey: "beerList",
    listRatingsKey: "beerListWithRatings",
    averageKey: "beerListWithAverageRatings",
    bucketLabel: "Brewery",
    productField: "brewery",
    idField: "beer_id",
    listEndpoint: "/beers/",
    ratingsEndpoint: "/beers_with_ratings/",
    averageEndpoint: "/beers_with_average_ratings/",
    rateEndpoint: "/rate_beer/",
    typeOptions: ["Draught", "Can", "Bottle"],
    extraMetricLabel: "Texture",
    extraMetricKey: "avg_texture",
    extraDetailMetricKey: "texture",
    extraFormKey: "texture",
    extraScaleWords: [
      { value: 0, label: "Undrinkable" },
      { value: 2.5, label: "Unpleasant" },
      { value: 5, label: "Standard" },
      { value: 7.5, label: "Pleasant" },
      { value: 10, label: "Perfect" },
    ],
  },
  cider: {
    key: "cider",
    label: "Cider",
    plural: "ciders",
    emoji: "🍏",
    accent: "#198754",
    listKey: "ciderList",
    listRatingsKey: "ciderListWithRatings",
    averageKey: "ciderListWithAverageRatings",
    bucketLabel: "Brewery",
    productField: "brewery",
    idField: "cider_id",
    listEndpoint: "/ciders/",
    ratingsEndpoint: "/ciders_with_ratings/",
    averageEndpoint: "/ciders_with_average_ratings/",
    rateEndpoint: "/rate_cider/",
    typeOptions: ["Dry", "Medium", "Sweet"],
    extraMetricLabel: "Texture",
    extraMetricKey: "avg_texture",
    extraDetailMetricKey: "texture",
    extraFormKey: "texture",
    extraScaleWords: [
      { value: 0, label: "Undrinkable" },
      { value: 2.5, label: "Unpleasant" },
      { value: 5, label: "Standard" },
      { value: 7.5, label: "Pleasant" },
      { value: 10, label: "Perfect" },
    ],
  },
  wine: {
    key: "wine",
    label: "Wine",
    plural: "wines",
    emoji: "🍷",
    accent: "#a14373",
    listKey: "wineList",
    listRatingsKey: "wineListWithRatings",
    averageKey: "wineListWithAverageRatings",
    bucketLabel: "Winery",
    productField: "winery",
    idField: "wine_id",
    listEndpoint: "/wines/",
    ratingsEndpoint: "/wines_with_ratings/",
    averageEndpoint: "/wines_with_average_ratings/",
    rateEndpoint: "/rate_wine/",
    typeOptions: ["Red", "White", "Rosé", "Sparkling"],
    extraMetricLabel: "Sessionability",
    extraMetricKey: "avg_sessionability",
    extraDetailMetricKey: "sessionability",
    extraFormKey: "sessionability",
    extraScaleWords: [
      { value: 0, label: "Hard to drink" },
      { value: 2.5, label: "Low" },
      { value: 5, label: "Balanced" },
      { value: 7.5, label: "Easy" },
      { value: 10, label: "Perfect" },
    ],
  },
};

const COLLAPSED_SHEET_HEIGHT = 84;

const BEER_STYLE_OPTIONS = [
  "IPA",
  "Session IPA",
  "Pale Ale",
  "Session Pale",
  "American Pale Ale",
  "India Pale Lager",
  "Lager",
  "Pilsner",
  "Kellerbier",
  "Helles",
  "Amber Ale",
  "Brown Ale",
  "Porter",
  "Stout",
  "Milk Stout",
  "Imperial Stout",
  "Wheat Beer",
  "Hefeweizen",
  "Belgian Blonde",
  "Saison",
  "Dubbel",
  "Tripel",
  "Sour",
  "Gose",
  "Lambic",
  "Barleywine",
];

const COUNTRY_OPTIONS = [];
const REGION_OPTIONS = [];

// Dummy local "known product" datasets used to power the lookup/autofill
// experience. Swap these arrays out for the real datasets whenever they're
// ready — the shape (name/producer/style/type[/country]) is all that
// matters, everything downstream reads from this shape.
const KNOWN_PRODUCTS = {
  beer: [
    { name: "Stella Artois", producer: "AB InBev", style: "Pilsner", type: "Bottle" },
    { name: "Guinness Draught", producer: "Diageo", style: "Stout", type: "Draught" },
    { name: "Corona Extra", producer: "Grupo Modelo", style: "Lager", type: "Bottle" },
    { name: "Peroni Nastro Azzurro", producer: "Asahi", style: "Lager", type: "Bottle" },
    { name: "Punk IPA", producer: "BrewDog", style: "IPA", type: "Can" },
    { name: "Heineken", producer: "Heineken N.V.", style: "Lager", type: "Can" },
    { name: "Camden Hells", producer: "Camden Town Brewery", style: "Helles", type: "Can" },
    { name: "Neck Oil", producer: "Beavertown Brewery", style: "Session Pale", type: "Can" },
    { name: "London Pride", producer: "Fuller's", style: "Amber Ale", type: "Draught" },
    { name: "Asahi Super Dry", producer: "Asahi", style: "Lager", type: "Can" },
    { name: "Estrella Damm", producer: "Damm", style: "Lager", type: "Bottle" },
    { name: "Sierra Nevada Pale Ale", producer: "Sierra Nevada", style: "Pale Ale", type: "Bottle" },
    { name: "Guinness 0.0", producer: "Diageo", style: "Stout", type: "Can" },
    { name: "Brooklyn Lager", producer: "Brooklyn Brewery", style: "Amber Ale", type: "Bottle" },
    { name: "Jaipur", producer: "Thornbridge Brewery", style: "IPA", type: "Can" },
  ],
  cider: [
    { name: "Strongbow Original", producer: "Heineken UK", style: "Medium", type: "Can" },
    { name: "Berries & Cherries", producer: "Old Mout", style: "Sweet", type: "Bottle" },
    { name: "Aspall Draught", producer: "Aspall", style: "Dry", type: "Draught" },
    { name: "Mixed Fruit", producer: "Kopparberg", style: "Sweet", type: "Bottle" },
    { name: "Strawberry-Lime", producer: "Rekorderlig", style: "Sweet", type: "Bottle" },
    { name: "Thatchers Gold", producer: "Thatchers Cider", style: "Medium", type: "Can" },
    { name: "Stowford Press", producer: "Westons Cider", style: "Medium", type: "Bottle" },
    { name: "Bulmers Original", producer: "Heineken Ireland", style: "Sweet", type: "Can" },
    { name: "Crisp Apple", producer: "Angry Orchard", style: "Sweet", type: "Bottle" },
    { name: "Reveller", producer: "Orchard Pig", style: "Dry", type: "Bottle" },
  ],
  wine: [
    { name: "Yellow Tail Shiraz", producer: "Casella Family Brands", style: "Shiraz", type: "Red", country: "Australia" },
    { name: "Barefoot Pinot Grigio", producer: "Barefoot Wine & Bubbly", style: "Pinot Grigio", type: "White", country: "USA" },
    { name: "Whispering Angel", producer: "Château d'Esclans", style: "Rosé Blend", type: "Rosé", country: "France" },
    { name: "Impérial Brut", producer: "Moët & Chandon", style: "Champagne Blend", type: "Sparkling", country: "France" },
    { name: "Sauvignon Blanc", producer: "Oyster Bay Wines", style: "Sauvignon Blanc", type: "White", country: "New Zealand" },
    { name: "Rioja Reserva", producer: "Campo Viejo", style: "Tempranillo", type: "Red", country: "Spain" },
    { name: "Prosecco Extra Dry", producer: "Villa Sandi", style: "Glera", type: "Sparkling", country: "Italy" },
    { name: "Chardonnay", producer: "Kendall-Jackson", style: "Chardonnay", type: "White", country: "USA" },
    { name: "Cabernet Sauvignon", producer: "Concha y Toro", style: "Cabernet Sauvignon", type: "Red", country: "Chile" },
    { name: "Pinot Noir", producer: "Villa Maria Estate", style: "Pinot Noir", type: "Red", country: "New Zealand" },
  ],
};

const TASTE_SCALE_WORDS = [
  { value: 0, label: "Undrinkable" },
  { value: 10, label: "Truly awful" },
  { value: 20, label: "Bad" },
  { value: 30, label: "Below average" },
  { value: 40, label: "Meh" },
  { value: 50, label: "Average" },
  { value: 60, label: "Decent" },
  { value: 70, label: "Good" },
  { value: 80, label: "Very Good" },
  { value: 90, label: "Excellent" },
  { value: 100, label: "World class" },
];

const VALUE_SCALE_WORDS = [
  { value: 0, label: "Very Spenny" },
  { value: 5, label: "Bit Spenny" },
  { value: 10, label: "About Average" },
  { value: 15, label: "Bit Cheap" },
  { value: 20, label: "Mega Cheap" },
];

const PACKAGING_SCALE_WORDS = [
  { value: 0, label: "Hate" },
  { value: 1, label: "Dislike" },
  { value: 2, label: "It's okay" },
  { value: 3, label: "Like" },
  { value: 4, label: "Heavily Like" },
  { value: 5, label: "Love" },
];

const SCORE_BOUNDS = {
  taste: { min: 0, max: 100, label: "Taste" },
  value: { min: 0, max: 20, label: "Value" },
  texture: { min: 0, max: 10, label: "Texture" },
  sessionability: { min: 0, max: 10, label: "Sessionability" },
  packaging: { min: 0, max: 5, label: "Packaging" },
};

function validateAndNormalizeScores(form, config) {
  const fields = ["taste", "value", config.extraFormKey, "packaging"];
  const normalized = {};

  for (const field of fields) {
    const bounds = SCORE_BOUNDS[field];
    const numeric = Number(form[field]);

    if (!bounds || Number.isNaN(numeric)) {
      return {
        error: `${SCORE_BOUNDS[field]?.label || field} must be a number between ${bounds?.min ?? 0} and ${bounds?.max ?? 10}.`,
      };
    }

    if (numeric < bounds.min || numeric > bounds.max) {
      return {
        error: `${bounds.label} must be between ${bounds.min} and ${bounds.max}.`,
      };
    }

    normalized[field] = numeric;
  }

  return { normalized };
}

function getExpandedSheetHeight() {
  if (typeof window === "undefined") {
    return 520;
  }
  return Math.max(220, Math.floor(window.innerHeight - 24));
}

function normalizeHexColor(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

function normalizeBeerType(value) {
  if (typeof value !== "string") {
    return "";
  }

  const lower = value.trim().toLowerCase();
  if (lower === "draft") {
    return "draught";
  }

  return lower;
}

function getUserId(user) {
  if (!user) return null;
  if (typeof user.id !== "undefined" && user.id !== null)
    return Number(user.id);
  if (typeof user.url === "string") {
    const match = user.url.match(/\/(\d+)\/?$/);
    if (match) return Number(match[1]);
  }
  return null;
}

function parseStorageJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getDefaultUserColor(userId) {
  const palette = [
    "#7c5cff",
    "#4aa9ff",
    "#00b894",
    "#ff7f50",
    "#ff5db1",
    "#f1a208",
    "#5e60ce",
  ];
  const numeric = Number(userId);
  return Number.isNaN(numeric) ? palette[0] : palette[numeric % palette.length];
}

function getUserColor(user) {
  const customColor = normalizeHexColor(user?.color);
  if (customColor) {
    return customColor;
  }
  return getDefaultUserColor(user?.id);
}

function fmt(num, isMobile) {
  if (num === null || num === undefined || num === 0) return "-";
  const n = Number(num);
  if (Number.isNaN(n)) return "-";
  if (isMobile) return String(Math.round(n));
  return n.toFixed(1);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const toHex = (channel) => Math.round(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(colorA, colorB, t) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

function getScaleColor(value, maxValue) {
  const low = "#f4c7c3";
  const mid = "#fff2cc";
  const high = "#d9ead3";

  const numeric = Number(value);
  if (Number.isNaN(numeric) || maxValue <= 0) {
    return "transparent";
  }

  const ratio = Math.max(0, Math.min(1, numeric / maxValue));
  if (ratio <= 0.5) {
    return mixHex(low, mid, ratio / 0.5);
  }
  return mixHex(mid, high, (ratio - 0.5) / 0.5);
}

function getScoreCellStyle(value, maxValue) {
  if (value === null || value === undefined || value === 0) {
    return undefined;
  }

  return {
    backgroundColor: getScaleColor(value, maxValue),
  };
}

// One-time styles for the score picker. Embedded here (rather than in an
// external stylesheet) so this component is self-contained — move these
// rules into the real CSS file whenever convenient.
function ScorePickerStyles() {
  return (
    <style>{`
      .score-picker {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        min-width: 0;
      }
      .score-bucket-row, .score-pill-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        width: 100%;
        min-width: 0;
        /* No 'gap' here on purpose — with items collapsing to zero width
           a flex 'gap' still reserves space for every item pair, which is
           what caused the big empty band between the selected chip and the
           numbers. Spacing is handled per-item via margin instead, so
           collapsed items can zero their own margin out too. */
      }
      .score-bucket-wrap, .score-pill-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 100%;
        margin: 0 6px 6px 0;
        transition:
          max-width 260ms ease,
          opacity 220ms ease,
          margin 260ms ease;
      }
      .score-bucket, .score-pill {
        border: 1px solid var(--score-accent, #6f5ef5);
        background: #ffffff;
        color: #1f1b2d;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 0.85rem;
        line-height: 1;
        cursor: pointer;
        max-width: 100%;
        white-space: nowrap;
        transition: background-color 150ms ease, color 150ms ease, transform 100ms ease;
      }
      .score-bucket:hover, .score-pill:hover { transform: translateY(-1px); }
      /* The selected bucket "pops" to the front of the row (flex order isn't
         itself animatable, but combined with its neighbours shrinking away
         at the same time it reads as the chip sliding left). Breadcrumbs
         from earlier levels use their own (more negative) order so the
         oldest picks stay leftmost and the newest sits just after them. */
      .score-bucket-wrap.open { order: -1; }
      .score-bucket-wrap.crumb-0 { order: -5; }
      .score-bucket-wrap.crumb-1 { order: -4; }
      .score-bucket-wrap.crumb-2 { order: -3; }
      .score-bucket-wrap.crumb-3 { order: -2; }
      .score-bucket.open {
        background: var(--score-accent, #6f5ef5);
        color: #ffffff;
        font-weight: 600;
      }
      .score-bucket.has-value:not(.open) {
        background: color-mix(in srgb, var(--score-accent, #6f5ef5) 18%, #ffffff);
      }
      .score-bucket-back {
        padding: 6px 14px;
        font-size: 1rem;
        font-weight: 700;
        line-height: 1;
      }
      /* Buckets other than the one selected shrink away to nothing instead
         of being removed outright, so the collapse itself is animated —
         and their margin collapses to zero too, so no leftover gap. These
         stay mounted (same key) at every depth so the shrink plays even
         several levels down, rather than the row just jump-cutting. */
      .score-bucket-wrap.collapsed-away {
        max-width: 0;
        opacity: 0;
        margin: 0;
        overflow: hidden;
        pointer-events: none;
      }
      .score-pill.selected {
        background: var(--score-accent, #6f5ef5);
        color: #ffffff;
        font-weight: 600;
      }
      /* Individual numbers / next-level chunks "file in" one after another
         into the space the collapsed buckets left behind. */
      .score-pill-wrap.file-in, .score-bucket-wrap.file-in {
        animation: score-pill-file-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes score-pill-file-in {
        from { opacity: 0; transform: translateX(-10px) scale(0.8); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }
      .score-bucket-label, .score-pill-label {
        font-size: 0.65rem;
        color: #6b6580;
        margin-top: 3px;
        text-align: center;
        max-width: 64px;
        line-height: 1.1;
      }
      .score-picker-value {
        font-size: 0.8rem;
        color: #6b6580;
      }
      .score-picker-value strong {
        color: #1f1b2d;
      }
    `}</style>
  );
}

// "Nice" round bucket sizes, tried smallest-first, so grouping reads
// naturally (0-19, 20-39, ...) instead of odd machine-even splits.
const NICE_BUCKET_SIZES = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const MAX_BUTTONS_PER_LEVEL = 5;

function pickBucketSize(lo, hi) {
  const span = hi - lo;
  if (span <= 0) return 1;
  for (const size of NICE_BUCKET_SIZES) {
    if (Math.ceil(span / size) <= MAX_BUTTONS_PER_LEVEL) return size;
  }
  return NICE_BUCKET_SIZES[NICE_BUCKET_SIZES.length - 1];
}

// Splits [lo, hi] into at most MAX_BUTTONS_PER_LEVEL chunks. Any overflow
// chunk (from rounding to a "nice" size) gets folded into the previous one
// so the cap always holds — e.g. 0-100 becomes 0-19/20-39/40-59/60-79/80-100
// rather than spilling into a 6th button.
function buildChunks(lo, hi) {
  const bucketSize = pickBucketSize(lo, hi);
  const chunks = [];
  let start = lo;
  while (start <= hi) {
    const end = Math.min(start + bucketSize - 1, hi);
    chunks.push([start, end]);
    start = end + 1;
  }
  while (chunks.length > MAX_BUTTONS_PER_LEVEL) {
    const overflow = chunks.pop();
    chunks[chunks.length - 1][1] = overflow[1];
  }
  return chunks;
}

// Walks from the full [min, max] range down to whichever chunk currently
// contains targetValue, so opening a product that already has a saved
// rating (or switching products) shows the drill-down path already in
// place instead of starting back at the top every time.
function computeChunkPath(min, max, targetValue) {
  const path = [];
  let lo = min;
  let hi = max;
  while (hi - lo + 1 > MAX_BUTTONS_PER_LEVEL) {
    const chunks = buildChunks(lo, hi);
    const match =
      chunks.find(([cLo, cHi]) => targetValue >= cLo && targetValue <= cHi) ||
      chunks[chunks.length - 1];
    path.push(match);
    [lo, hi] = match;
  }
  return path;
}

function bucketLabel(lo, hi, max) {
  if (lo === hi) return `${lo}`;
  if (hi === max) return `${lo}+`;
  return `${lo}-${hi}`;
}

/**
 * Renders a rating field as tappable pills instead of a raw number input,
 * capped at 5 buttons per level. Ranges that don't fit in 5 individual
 * numbers get grouped into at-most-5 buckets (0-19, 20-39, ...); tapping a
 * bucket immediately sets its start value as the rating (so a rough pick
 * is already a valid, saved-worthy answer) and — with an animated
 * collapse-and-file-in — reveals the next level down (either finer buckets
 * or, once 5 or fewer values remain, the individual numbers). Already-
 * chosen levels stay visible as small breadcrumb chips on the left, each
 * tappable to go back up. `points` (the same word-scale arrays used
 * elsewhere, e.g. TASTE_SCALE_WORDS) are matched to the nearest whole
 * number and rendered as a small label under that bucket/number.
 */
function ScoreBucketPicker({ value, min, max, accent, points, onSelect }) {
  const numericValue = value === "" ? null : Number(value);

  const [path, setPath] = useState(() =>
    numericValue ? computeChunkPath(min, max, numericValue) : [],
  );
  const userChangedValue = useRef(false);

  // Keep the drill-down path in sync when the value changes for reasons
  // other than the user tapping something in this component (e.g.
  // switching to a product that already has a saved rating).
  useEffect(() => {
    if (userChangedValue.current) {
      userChangedValue.current = false;
      return;
    }

    setPath(numericValue ? computeChunkPath(min, max, numericValue) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue, min, max]);

  // Map each word-scale point onto the nearest whole number in range, so
  // e.g. a point at 2.5 labels the "2" or "3" pill, and a point at 30
  // labels the "30" bucket/pill exactly.
  const wordLabelByValue = useMemo(() => {
    const map = {};
    (points || []).forEach((point) => {
      const rounded = Math.round(point.value);
      const clamped = Math.max(min, Math.min(max, rounded));
      map[clamped] = point.label;
    });
    return map;
  }, [points, min, max]);

  const accentStyle = { "--score-accent": accent };

  function selectChunk(lo, hi) {
    userChangedValue.current = true;
    onSelect(lo);
    if (hi > lo) {
      setPath((current) => [...current, [lo, hi]]);
    }
  }

  function goBackTo(levelIndex) {
    setPath((current) => current.slice(0, levelIndex));
  }

  // Build one row item per chunk button that could appear: already-
  // committed breadcrumbs ("chip"), their passed-over siblings ("ghost" —
  // kept mounted with a stable key so they visibly shrink away instead of
  // just vanishing), and the currently choosable set at the frontier
  // ("active"). Using a stable `b-{lo}-{hi}` key across all three roles is
  // what lets the CSS transition play instead of React just swapping in a
  // brand new element.
  const rowItems = [];
  for (let level = 0; level < path.length; level += 1) {
    const [parentLo, parentHi] = level === 0 ? [min, max] : path[level - 1];
    // Only the most recently committed level shows as the visible "chip" —
    // a single back arrow, regardless of how many levels deep we are.
    // Earlier committed levels collapse away like their passed-over
    // siblings instead of staying visible as separate breadcrumbs.
    const isLastLevel = level === path.length - 1;
    buildChunks(parentLo, parentHi).forEach(([cLo, cHi]) => {
      const isChosen = cLo === path[level][0] && cHi === path[level][1];
      const role = isChosen && isLastLevel ? "chip" : "ghost";
      rowItems.push({ lo: cLo, hi: cHi, role, level });
    });
  }

  const [frontierLo, frontierHi] = path.length ? path[path.length - 1] : [min, max];
  const frontierCount = frontierHi - frontierLo + 1;
  const isLeaf = frontierCount <= MAX_BUTTONS_PER_LEVEL;

  if (!isLeaf) {
    buildChunks(frontierLo, frontierHi).forEach(([cLo, cHi]) => {
      rowItems.push({ lo: cLo, hi: cHi, role: "active", level: path.length });
    });
  }

  let animIndex = 0;

  return (
    <div className="score-picker" style={accentStyle}>
      <div className="score-bucket-row" role="group">
        {rowItems.map(({ lo, hi, role, level }) => {
          if (role === "ghost") {
            return (
              <div
                key={`b-${lo}-${hi}`}
                className="score-bucket-wrap collapsed-away"
                aria-hidden="true"
              />
            );
          }

          const isChip = role === "chip";
          const hasValue =
            numericValue !== null && numericValue >= lo && numericValue <= hi;
          const wrapClasses = ["score-bucket-wrap"];
          if (isChip) {
            wrapClasses.push("open", `crumb-${Math.min(level, 3)}`);
          } else {
            wrapClasses.push("file-in");
          }
          const delay = isChip ? 0 : Math.min(animIndex * 30, 200);
          if (!isChip) animIndex += 1;

          return (
            <div
              key={`b-${lo}-${hi}`}
              className={wrapClasses.join(" ")}
              style={!isChip ? { animationDelay: `${delay}ms` } : undefined}
            >
              <button
                type="button"
                className={`score-bucket ${isChip ? "open score-bucket-back" : ""} ${hasValue ? "has-value" : ""}`}
                aria-expanded={isChip}
                aria-label={isChip ? "Back" : undefined}
                onClick={() => (isChip ? goBackTo(level) : selectChunk(lo, hi))}
              >
                {isChip ? "‹" : bucketLabel(lo, hi, max)}
              </button>
              {!isChip && wordLabelByValue[lo] && (
                <span className="score-bucket-label">{wordLabelByValue[lo]}</span>
              )}
            </div>
          );
        })}

        {isLeaf &&
          frontierCount > 1 &&
          Array.from({ length: frontierCount }, (_, i) => frontierLo + i).map(
            (option, index) => (
              <div
                key={`n-${option}`}
                className="score-pill-wrap file-in"
                style={{ animationDelay: `${Math.min(index * 22, 200)}ms` }}
              >
                <button
                  type="button"
                  className={`score-pill ${numericValue === option ? "selected" : ""}`}
                  onClick={() => onSelect(option)}
                >
                  {option}
                </button>
                {wordLabelByValue[option] && (
                  <span className="score-pill-label">{wordLabelByValue[option]}</span>
                )}
              </div>
            ),
          )}
      </div>
    </div>
  );
}

function getRatedByDisplay(beer) {
  if (!Array.isArray(beer?.rated_by) || beer.rated_by.length === 0) {
    return "-";
  }
  return beer.rated_by.join(", ");
}

function getRatedByCount(beer) {
  return Array.isArray(beer?.rated_by) ? beer.rated_by.length : 0;
}

function hasUserContributed(beer, username) {
  if (!Array.isArray(beer?.rated_by)) {
    return false;
  }
  return beer.rated_by.includes(username);
}

function getUserShortLabel(username) {
  if (typeof username !== "string") {
    return "--";
  }
  return username.trim().slice(0, 2).toUpperCase() || "--";
}

function getContributorsPieStyle(beer, selectedUsers) {
  if (!Array.isArray(selectedUsers) || selectedUsers.length === 0) {
    return { background: "#ffffff" };
  }

  const sliceSize = 360 / selectedUsers.length;
  const slices = selectedUsers
    .map((user, index) => {
      const start = index * sliceSize;
      const end = (index + 1) * sliceSize;
      const color = getUserColor(user);
      const contributed = hasUserContributed(beer, user.username);
      const sliceColor = contributed ? color : "#f0ecff";
      return `${sliceColor} ${start}deg ${end}deg`;
    })
    .join(", ");

  return {
    background: `conic-gradient(${slices})`,
  };
}

function TablePage({ onSignOut, beverage = "beer" }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const config = BEVERAGE_CONFIG[beverage] || BEVERAGE_CONFIG.beer;

  const usersList = useMemo(() => parseStorageJson(USERS_LIST_KEY, []), []);
  const [beverageRatingsList, setBeverageRatingsList] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [averageData, setAverageData] = useState([]);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [closingProductId, setClosingProductId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 768px)").matches
      : false,
  );
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("none");
  const [ratingsVersion, setRatingsVersion] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(COLLAPSED_SHEET_HEIGHT);
  const [expandedSheetHeight, setExpandedSheetHeight] = useState(() =>
    getExpandedSheetHeight(),
  );
  const [dragStartY, setDragStartY] = useState(null);
  const [dragStartHeight, setDragStartHeight] = useState(
    COLLAPSED_SHEET_HEIGHT,
  );
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [suppressHandleToggle, setSuppressHandleToggle] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [currentUsername, setCurrentUsername] = useState("");
  const [activeSearchInput, setActiveSearchInput] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    producerQuery: "",
    nameQuery: "",
    styleQuery: "",
    countryQuery: "",
    regionQuery: "",
    typeQuery: "",
    taste: 0,
    value: 0,
    texture: 0,
    sessionability: 0,
    packaging: 0,
  });
  const nameInputRef = useRef(null);
  const producerInputRef = useRef(null);
  const countryInputRef = useRef(null);
  const styleInputRef = useRef(null);

  const users = useMemo(
    () =>
      usersList
        .map((u) => ({
          id: getUserId(u),
          username: u.username,
          color: normalizeHexColor(u.color),
        }))
        .filter(
          (u) =>
            u.id !== null &&
            typeof u.username === "string" &&
            !u.username.toLowerCase().includes("admin"),
        ),
    [usersList],
  );

  const allUsersSelected =
    users.length > 0 && selectedUserIds.length === users.length;

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.includes(user.id)),
    [selectedUserIds, users],
  );

  // Load the correct local cache whenever the beverage changes.
  useEffect(() => {
    setBeverageRatingsList(parseStorageJson(config.listRatingsKey, []));
    setAverageData([]);
    setExpandedProductId(null);
    setClosingProductId(null);
    setSortKey(null);
    setSortDirection("none");
    setRatingError("");
    setRatingForm({
      producerQuery: "",
      nameQuery: "",
      styleQuery: "",
      countryQuery: "",
      regionQuery: "",
      typeQuery: "",
      taste: 0,
      value: 0,
      texture: 0,
      sessionability: 0,
      packaging: 0,
    });
  }, [config.key, config.listRatingsKey]);

  // The lookup is a merge of two sources:
  //  1. The local "known products" dataset (KNOWN_PRODUCTS) — a big list of
  //     real-world products so users can type "Stella" and have everything
  //     else autofill, even before anyone has ever rated it.
  //  2. Products that already exist in this group's rating history, which
  //     carry a real backend id.
  // Entries are de-duped by name+producer, with the rating-history version
  // winning (it has the real id needed to attach a new rating to it).
  const productCatalog = useMemo(() => {
    const fromKnownDataset = (KNOWN_PRODUCTS[config.key] || []).map(
      (product) => ({
        id: `known-${config.key}-${product.name}-${product.producer}`,
        name: String(product.name || ""),
        producer: String(product.producer || ""),
        style: String(product.style || ""),
        type: String(product.type || ""),
        country: String(product.country || ""),
      }),
    );

    const fromRatingHistory = averageData.map((product) => ({
      id: product.id,
      name: String(product.name || ""),
      producer: String(product?.[config.productField] || ""),
      style: String(product.style || ""),
      type: String(product.type || ""),
      country: String(product.country || ""),
    }));

    const byKey = new Map();
    [...fromKnownDataset, ...fromRatingHistory].forEach((product) => {
      const key = `${product.name.toLowerCase()}|${product.producer.toLowerCase()}`;
      byKey.set(key, product);
    });

    return Array.from(byKey.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [averageData, config.key, config.productField]);

  const producerSuggestions = useMemo(
    () =>
      [...new Set(productCatalog.map((product) => product.producer))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [productCatalog],
  );

  const productSuggestions = useMemo(
    () =>
      [...new Set(productCatalog.map((product) => product.name))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [productCatalog],
  );

  const styleOptions = useMemo(() => {
    const fromCatalog = productCatalog
      .map((product) => product.style)
      .filter(Boolean);

    const defaults = config.key === "beer" ? BEER_STYLE_OPTIONS : [];
    const uniqueByLower = new Map();

    [...defaults, ...fromCatalog].forEach((style) => {
      const normalized = style.trim();
      if (!normalized) return;
      const key = normalized.toLowerCase();
      if (!uniqueByLower.has(key)) {
        uniqueByLower.set(key, normalized);
      }
    });

    return Array.from(uniqueByLower.values()).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [config.key, productCatalog]);

  const filteredProducerSuggestions = useMemo(() => {
    const query = ratingForm.producerQuery.trim().toLowerCase();
    if (!query) return producerSuggestions.slice(0, 8);

    return producerSuggestions
      .filter((value) => value.toLowerCase().includes(query))
      .slice(0, 8);
  }, [producerSuggestions, ratingForm.producerQuery]);

  const filteredProductSuggestions = useMemo(() => {
    const query = ratingForm.nameQuery.trim().toLowerCase();
    if (!query) return productSuggestions.slice(0, 8);

    return productSuggestions
      .filter((value) => value.toLowerCase().includes(query))
      .slice(0, 8);
  }, [productSuggestions, ratingForm.nameQuery]);

  const filteredStyleSuggestions = useMemo(() => {
    const query = ratingForm.styleQuery.trim().toLowerCase();
    if (!query) return styleOptions.slice(0, 8);

    return styleOptions
      .filter((value) => value.toLowerCase().includes(query))
      .slice(0, 8);
  }, [ratingForm.styleQuery, styleOptions]);

  const countryOptions = useMemo(() => {
    const fromCatalog = productCatalog
      .map((product) => product.country)
      .filter(Boolean);

    return [...new Set([...COUNTRY_OPTIONS, ...fromCatalog])].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [productCatalog]);

  const filteredCountrySuggestions = useMemo(() => {
    const query = (ratingForm.countryQuery || "").trim().toLowerCase();
    if (!query) return countryOptions.slice(0, 8);

    return countryOptions
      .filter((value) => value.toLowerCase().includes(query))
      .slice(0, 8);
  }, [countryOptions, ratingForm.countryQuery]);

  const matchedProducts = useMemo(() => {
    const producerQuery = ratingForm.producerQuery.trim().toLowerCase();
    const nameQuery = ratingForm.nameQuery.trim().toLowerCase();
    const styleQuery = ratingForm.styleQuery.trim().toLowerCase();
    const countryQuery = ratingForm.countryQuery.trim().toLowerCase();
    const regionQuery = ratingForm.regionQuery.trim().toLowerCase();
    const typeQuery = normalizeBeerType(ratingForm.typeQuery);

    return productCatalog.filter((product) => {
      const producerMatch = producerQuery
        ? product.producer.toLowerCase().includes(producerQuery)
        : true;
      const nameMatch = nameQuery
        ? product.name.toLowerCase().includes(nameQuery)
        : true;
      const styleMatch = styleQuery
        ? product.style.toLowerCase().includes(styleQuery)
        : true;
      const countryMatch = countryQuery
        ? product.country.toLowerCase().includes(countryQuery)
        : true;
      const regionMatch = regionQuery
        ? product.region.toLowerCase().includes(regionQuery)
        : true;
      const typeMatch = typeQuery
        ? normalizeBeerType(product.type) === typeQuery
        : true;

      return (
        producerMatch && nameMatch && styleMatch && typeMatch && countryMatch
      );
    });
  }, [
    productCatalog,
    ratingForm.nameQuery,
    ratingForm.producerQuery,
    ratingForm.styleQuery,
    ratingForm.countryQuery,
    ratingForm.regionQuery,
    ratingForm.typeQuery,
  ]);

  const selectedProductForRating = useMemo(() => {
    const producerQuery = ratingForm.producerQuery.trim().toLowerCase();
    const nameQuery = ratingForm.nameQuery.trim().toLowerCase();
    const styleQuery = ratingForm.styleQuery.trim().toLowerCase();
    const typeQuery = normalizeBeerType(ratingForm.typeQuery);

    const exactMatches = productCatalog.filter(
      (product) =>
        product.producer.toLowerCase() === producerQuery &&
        product.name.toLowerCase() === nameQuery &&
        producerQuery.length > 0 &&
        nameQuery.length > 0 &&
        (styleQuery.length === 0 ||
          product.style.toLowerCase() === styleQuery) &&
        (typeQuery.length === 0 ||
          normalizeBeerType(product.type) === typeQuery),
    );

    if (exactMatches.length === 1) return exactMatches[0];
    if (matchedProducts.length === 1) return matchedProducts[0];

    return null;
  }, [
    matchedProducts,
    productCatalog,
    ratingForm.nameQuery,
    ratingForm.producerQuery,
    ratingForm.styleQuery,
    ratingForm.typeQuery,
  ]);

  const currentUserId = useMemo(() => {
    if (!currentUsername) return null;

    const match = users.find(
      (user) => user.username.toLowerCase() === currentUsername.toLowerCase(),
    );

    return match ? Number(match.id) : null;
  }, [currentUsername, users]);

  const sortedAverageData = useMemo(() => {
    if (!sortKey || sortDirection === "none") return averageData;

    const rows = [...averageData];

    rows.sort((a, b) => {
      if (sortKey === "rated_by") {
        const aValue = getRatedByCount(a);
        const bValue = getRatedByCount(b);

        if (aValue !== bValue) {
          const result = aValue - bValue;
          return sortDirection === "asc" ? result : -result;
        }

        const tieBreak = String(a?.name ?? "").localeCompare(
          String(b?.name ?? ""),
        );
        return sortDirection === "asc" ? tieBreak : -tieBreak;
      }

      if (
        sortKey === config.productField ||
        sortKey === "name" ||
        sortKey === "style" ||
        sortKey === "type"
      ) {
        const aValue = String(a?.[sortKey] ?? "");
        const bValue = String(b?.[sortKey] ?? "");
        const result = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? result : -result;
      }

      const aValue = toNumber(a?.[sortKey]);
      const bValue = toNumber(b?.[sortKey]);
      const result = aValue - bValue;

      return sortDirection === "asc" ? result : -result;
    });

    return rows;
  }, [averageData, config.productField, sortDirection, sortKey]);

  useEffect(() => {
    setSelectedUserIds(users.map((u) => u.id));
  }, [users]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const onChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (users.length === 0) return;

    if (selectedUserIds.length === 0) {
      setAverageData([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const token = localStorage.getItem("authToken") || "";
    const headers = {};
    if (token) headers["Authorization"] = `Token ${token}`;

    const allSelected = selectedUserIds.length === users.length;
    let url = `${apiBaseUrl}${config.averageEndpoint}`;

    if (!allSelected) {
      const params = new URLSearchParams();

      users
        .filter((u) => selectedUserIds.includes(u.id))
        .forEach((u) => params.append("users", u.username));

      url += `?${params.toString()}`;
    }

    fetch(url, { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (!cancelled) {
          setAverageData(Array.isArray(data) ? data : []);
        }
      })
      .catch((e) =>
        console.error(`Failed to fetch ${config.label} averages`, e),
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    apiBaseUrl,
    config.averageEndpoint,
    ratingsVersion,
    selectedUserIds,
    users,
  ]);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || "";
    if (!token) return;

    fetch(`${apiBaseUrl}/my-color/`, {
      method: "GET",
      headers: { Authorization: `Token ${token}` },
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(response.status),
      )
      .then((payload) => {
        if (typeof payload?.username === "string") {
          setCurrentUsername(payload.username);
        }
      })
      .catch(() => {});
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!selectedProductForRating || !currentUserId) return;

    const productRecord = beverageRatingsList.find(
      (product) => Number(product?.id) === Number(selectedProductForRating.id),
    );

    const ratings = Array.isArray(productRecord?.ratings)
      ? productRecord.ratings
      : [];

    const existingRating = [...ratings]
      .reverse()
      .find((rating) => Number(rating?.user?.id) === Number(currentUserId));

    if (existingRating) {
      setRatingForm((current) => ({
        ...current,
        taste: Number(existingRating.taste ?? 0),
        value: Number(existingRating.value ?? 0),
        [config.extraFormKey]: Number(
          existingRating[config.extraDetailMetricKey] ?? 0,
        ),
        packaging: Number(existingRating.packaging ?? 0),
      }));
      return;
    }

    setRatingForm((current) => ({
      ...current,
      taste: 0,
      value: 0,
      [config.extraFormKey]: 0,
      packaging: 0,
    }));
  }, [
    beverageRatingsList,
    config.extraDetailMetricKey,
    config.extraFormKey,
    currentUserId,
    selectedProductForRating,
  ]);

  // Autofill from the lookup as soon as what's typed in the name field
  // uniquely (and exactly) matches something in the dataset — the user
  // shouldn't have to click a suggestion for this to kick in. If nothing
  // matches, the fields are left alone so manual entry still works.
  useEffect(() => {
    const query = ratingForm.nameQuery.trim().toLowerCase();
    if (!query) return;

    const exactMatches = productCatalog.filter(
      (product) => product.name.toLowerCase() === query,
    );

    if (exactMatches.length !== 1) return;

    const match = exactMatches[0];
    setRatingForm((current) => {
      if (
        current.producerQuery === match.producer &&
        current.styleQuery === match.style &&
        current.typeQuery === match.type &&
        (current.countryQuery || "") === (match.country || current.countryQuery || "")
      ) {
        return current;
      }

      return {
        ...current,
        producerQuery: match.producer,
        styleQuery: match.style,
        typeQuery: match.type,
        countryQuery: match.country || current.countryQuery,
      };
    });
  }, [productCatalog, ratingForm.nameQuery]);

  function onSheetPointerDown(event) {
    event.preventDefault();
    setSuppressHandleToggle(false);
    setIsDraggingSheet(true);
    setDragStartY(event.clientY);
    setDragStartHeight(sheetHeight);
  }

  function onSheetPointerMove(event) {
    if (dragStartY === null) return;

    const delta = dragStartY - event.clientY;
    const nextHeight = Math.max(
      COLLAPSED_SHEET_HEIGHT,
      Math.min(expandedSheetHeight, dragStartHeight + delta),
    );

    setSheetHeight(nextHeight);
  }

  function onSheetPointerUp(event) {
    if (dragStartY === null) return;

    const endY =
      typeof event?.clientY === "number" ? event.clientY : dragStartY;
    const deltaY = dragStartY - endY;
    const movedEnoughToDrag = Math.abs(deltaY) > 3;

    if (deltaY > 0) {
      setSheetHeight(expandedSheetHeight);
    } else if (deltaY < 0) {
      setSheetHeight(COLLAPSED_SHEET_HEIGHT);
    }

    setSuppressHandleToggle(movedEnoughToDrag);
    setDragStartY(null);
    setIsDraggingSheet(false);
  }

  function onSheetHandleClick() {
    if (suppressHandleToggle) {
      setSuppressHandleToggle(false);
      return;
    }

    setSheetHeight((current) =>
      current <= COLLAPSED_SHEET_HEIGHT + 2
        ? expandedSheetHeight
        : COLLAPSED_SHEET_HEIGHT,
    );
  }

  useEffect(() => {
    const onResize = () => {
      const nextExpandedHeight = getExpandedSheetHeight();
      setExpandedSheetHeight(nextExpandedHeight);
      setSheetHeight((current) =>
        current <= COLLAPSED_SHEET_HEIGHT
          ? COLLAPSED_SHEET_HEIGHT
          : nextExpandedHeight,
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (dragStartY === null) return undefined;

    const handleMove = (event) => onSheetPointerMove(event);
    const handleUp = (event) => onSheetPointerUp(event);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragStartY, dragStartHeight, expandedSheetHeight]);

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  function updateRatingField(field, value) {
    if (!Object.prototype.hasOwnProperty.call(SCORE_BOUNDS, field)) {
      setRatingForm((current) => ({ ...current, [field]: value }));
      return;
    }

    if (value === "") {
      setRatingForm((current) => ({ ...current, [field]: "" }));
      return;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;

    const { min, max } = SCORE_BOUNDS[field];
    const clamped = Math.max(min, Math.min(max, numeric));

    setRatingForm((current) => ({ ...current, [field]: clamped }));
  }

  function applySelectedProduct(product) {
    setRatingForm((current) => ({
      ...current,
      nameQuery: product.name,
      producerQuery: product.producer,
      styleQuery: product.style,
      typeQuery: product.type,
      countryQuery: product.country || current.countryQuery,
    }));
  }

  function dismissRateKeyboard() {
    document.activeElement?.blur();
    setActiveSearchInput(null);
  }

  function handleRateFieldKeyDown(event, field) {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const fields =
      config.key === "wine"
        ? ["name", "producer", "country", "style"]
        : ["name", "producer", "style"];
    const nextField = fields[fields.indexOf(field) + 1];
    const nextInput = {
      name: nameInputRef,
      producer: producerInputRef,
      country: countryInputRef,
      style: styleInputRef,
    }[nextField];

    if (nextInput?.current) {
      nextInput.current.focus();
      setActiveSearchInput(nextField);
      return;
    }

    dismissRateKeyboard();
  }

  async function refreshBeverageCaches(token) {
    const headers = token ? { Authorization: `Token ${token}` } : {};

    const [listResponse, ratingsResponse, averageRatingsResponse] =
      await Promise.all([
        fetch(`${apiBaseUrl}${config.listEndpoint}`, {
          method: "GET",
          headers,
        }),
        fetch(`${apiBaseUrl}${config.ratingsEndpoint}`, {
          method: "GET",
          headers,
        }),
        fetch(`${apiBaseUrl}${config.averageEndpoint}`, {
          method: "GET",
          headers,
        }),
      ]);

    if (!listResponse.ok || !ratingsResponse.ok || !averageRatingsResponse.ok) {
      throw new Error(`Failed to refresh ${config.label.toLowerCase()} data`);
    }

    const [list, ratings, averageRatings] = await Promise.all([
      listResponse.json(),
      ratingsResponse.json(),
      averageRatingsResponse.json(),
    ]);

    localStorage.setItem(config.listKey, JSON.stringify(list));
    localStorage.setItem(config.listRatingsKey, JSON.stringify(ratings));
    localStorage.setItem(config.averageKey, JSON.stringify(averageRatings));
    setBeverageRatingsList(Array.isArray(ratings) ? ratings : []);
  }

  async function submitRating(event) {
    event.preventDefault();
    setRatingError("");

    const token = localStorage.getItem("authToken") || "";
    if (!token) {
      setRatingError("You are not authenticated.");
      return;
    }

    const validation = validateAndNormalizeScores(ratingForm, config);
    if (validation.error) {
      setRatingError(validation.error);
      return;
    }

    const resolvedName = String(
      selectedProductForRating?.name || ratingForm.nameQuery || "",
    ).trim();

    const resolvedProducer = String(
      selectedProductForRating?.producer || ratingForm.producerQuery || "",
    ).trim();

    const resolvedType = String(
      selectedProductForRating?.type || ratingForm.typeQuery || "",
    ).trim();

    const resolvedStyle = String(
      selectedProductForRating?.style || ratingForm.styleQuery || "",
    ).trim();

    if (!resolvedName || !resolvedProducer || !resolvedType || !resolvedStyle) {
      setRatingError(
        `Please provide name, ${config.bucketLabel.toLowerCase()}, type and style before saving.`,
      );
      return;
    }

    const payload = {
      [config.idField]: Number(selectedProductForRating?.id) || undefined,
      name: resolvedName,
      [config.productField]: resolvedProducer,
      type: resolvedType,
      style: resolvedStyle,
      ...validation.normalized,
    };

    setSavingRating(true);

    try {
      const response = await fetch(`${apiBaseUrl}${config.rateEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let responseBody = {};
      try {
        responseBody = await response.json();
      } catch {
        responseBody = {};
      }

      const apiMessage = responseBody?.details || responseBody?.detail || "";

      if (!response.ok) {
        const errorMessage =
          apiMessage || "Could not save rating. Please try again.";

        setRatingError(errorMessage);
        setToastType("error");
        setToastMessage(errorMessage);
        return;
      }

      try {
        await refreshBeverageCaches(token);
      } catch {
        // The rating request succeeded even if refreshing the cache failed.
      }

      setRatingsVersion((current) => current + 1);
      setSheetHeight(COLLAPSED_SHEET_HEIGHT);
      setToastType("success");
      setToastMessage(apiMessage || "Rating saved");

      setRatingForm({
        producerQuery: "",
        nameQuery: "",
        styleQuery: "",
        countryQuery: "",
        regionQuery: "",
        typeQuery: "",
        taste: 0,
        value: 0,
        texture: 0,
        sessionability: 0,
        packaging: 0,
      });
    } catch {
      setRatingError("Could not save rating. Please try again.");
      setToastType("error");
      setToastMessage("Could not save rating. Please try again.");
    } finally {
      setSavingRating(false);
    }
  }

  function toggleUser(userId) {
    setSelectedUserIds((current) => {
      const allSelected = current.length === users.length && users.length > 0;

      if (allSelected) return [userId];

      return current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
    });
  }

  function toggleSort(key) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("desc");
      return;
    }

    if (sortDirection === "desc") {
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("none");
      setSortKey(null);
      return;
    }

    setSortDirection("desc");
  }

  function renderSortIndicator(key) {
    if (sortKey !== key || sortDirection === "none") return "⇅";
    return sortDirection === "asc" ? "▴" : "▾";
  }

  function headerClass(key) {
    const active = sortKey === key && sortDirection !== "none";
    return `sortable-header ${active ? "active" : ""}`;
  }

  function toggleProductExpansion(productId) {
    if (expandedProductId === productId) {
      setClosingProductId(productId);
      setTimeout(() => {
        setExpandedProductId(null);
        setClosingProductId(null);
      }, 300);
    } else {
      setClosingProductId(null);
      setExpandedProductId(productId);
    }
  }

  const extraMetricValue = (product) => product?.[config.extraMetricKey];
  const extraDetailValue = (rating) => rating?.[config.extraDetailMetricKey];

  return (
    <main
      className="page table-page"
      style={{ paddingBottom: `${sheetHeight + 18}px` }}
    >
      <div className="table-top-actions" aria-label="Page actions">
        <Link
          className="icon-link-button"
          to="/home"
          aria-label="Home"
          title="Home"
        >
          <span aria-hidden="true">🏠</span>
        </Link>
        <button
          type="button"
          className="icon-button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <span aria-hidden="true">⏻</span>
        </button>
      </div>

      <section className="table-shell playful-card">
        <div className="table-header">
          <h1>
            {config.label} Ratings {config.emoji}
          </h1>
        </div>

        {users.length > 0 && (
          <div
            className="user-filters"
            role="group"
            aria-label="Filter by users"
          >
            <button
              type="button"
              className={`user-chip ${allUsersSelected ? "selected" : ""}`}
              onClick={() => setSelectedUserIds(users.map((user) => user.id))}
              style={{
                borderColor: "#6f5ef5",
                backgroundColor: allUsersSelected ? "#6f5ef522" : "#ffffff",
                color: "#1f1b2d",
              }}
            >
              Select All
            </button>

            {users.map((user) => {
              const selected = selectedUserIds.includes(user.id);
              const color = getUserColor(user);

              return (
                <button
                  key={user.id}
                  type="button"
                  className={`user-chip ${selected ? "selected" : ""}`}
                  onClick={() => toggleUser(user.id)}
                  style={{
                    borderColor: color,
                    backgroundColor: selected ? `${color}22` : "#ffffff",
                    color: selected ? "#1f1b2d" : "#3d3855",
                  }}
                >
                  {user.username}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : averageData.length === 0 ? (
          <p className="empty-state">No ratings data found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="ratings-table">
              <thead>
                <tr>
                  <th
                    className={headerClass(config.productField)}
                    onClick={() => toggleSort(config.productField)}
                  >
                    {config.bucketLabel}{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator(config.productField)}
                    </span>
                  </th>
                  <th
                    className={headerClass("name")}
                    onClick={() => toggleSort("name")}
                  >
                    {config.label}{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("name")}
                    </span>
                  </th>
                  <th
                    className={`${headerClass("style")} style-column`}
                    onClick={() => toggleSort("style")}
                  >
                    Style{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("style")}
                    </span>
                  </th>
                  <th
                    className={headerClass("type")}
                    onClick={() => toggleSort("type")}
                  >
                    Type{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("type")}
                    </span>
                  </th>
                  <th
                    className={headerClass("rated_by")}
                    onClick={() => toggleSort("rated_by")}
                  >
                    <span className="rating-label">Rated By</span>
                    <span className="rating-icon" aria-hidden="true">
                      👥
                    </span>{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("rated_by")}
                    </span>
                  </th>
                  <th
                    className={headerClass("avg_taste")}
                    onClick={() => toggleSort("avg_taste")}
                  >
                    <span className="rating-label">Taste</span>
                    <span className="rating-icon" aria-hidden="true">
                      👅
                    </span>{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("avg_taste")}
                    </span>
                  </th>
                  <th
                    className={headerClass("avg_value")}
                    onClick={() => toggleSort("avg_value")}
                  >
                    <span className="rating-label">Value</span>
                    <span className="rating-icon" aria-hidden="true">
                      💷
                    </span>{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("avg_value")}
                    </span>
                  </th>
                  <th
                    className={headerClass(config.extraMetricKey)}
                    onClick={() => toggleSort(config.extraMetricKey)}
                  >
                    <span className="rating-label">
                      {config.extraMetricLabel}
                    </span>
                    <span className="rating-icon" aria-hidden="true">
                      {config.key === "wine" ? "🍷" : "🫧"}
                    </span>{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator(config.extraMetricKey)}
                    </span>
                  </th>
                  <th
                    className={headerClass("avg_packaging")}
                    onClick={() => toggleSort("avg_packaging")}
                  >
                    <span className="rating-label">Packaging</span>
                    <span className="rating-icon" aria-hidden="true">
                      📦
                    </span>{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("avg_packaging")}
                    </span>
                  </th>
                  <th
                    className={headerClass("avg_overall")}
                    onClick={() => toggleSort("avg_overall")}
                  >
                    <span className="rating-label">Overall</span>
                    <span className="rating-icon" aria-hidden="true">
                      ⭐
                    </span>{" "}
                    <span className="sort-indicator">
                      {renderSortIndicator("avg_overall")}
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedAverageData.map((product) => {
                  const isExpanded = expandedProductId === product.id;
                  const isClosing = closingProductId === product.id;
                  const showDetails = isExpanded || isClosing;
                  const hasMultipleRatings =
                    Array.isArray(product.ratings) &&
                    product.ratings.length > 1;

                  return (
                    <Fragment key={product.id}>
                      <tr
                        onClick={() =>
                          hasMultipleRatings &&
                          toggleProductExpansion(product.id)
                        }
                        style={{
                          cursor: hasMultipleRatings ? "pointer" : "default",
                        }}
                        className={isExpanded ? "expanded-row" : ""}
                      >
                        <td>{product?.[config.productField]}</td>
                        <td>
                          {isExpanded && (
                            <span
                              style={{ marginRight: "8px", fontSize: "12px" }}
                            >
                              ▼
                            </span>
                          )}
                          {product.name}
                        </td>
                        <td className="style-column">{product.style}</td>
                        <td>
                          {config.key === "beer" ? (
                            <BeerTypeIcon type={product.type} size={24} />
                          ) : (
                            <span title={product.type}>{product.type}</span>
                          )}
                        </td>
                        <td>
                          {selectedUsers.length === 0 ? (
                            "-"
                          ) : isMobile ? (
                            <span
                              className="contributors-pie"
                              style={getContributorsPieStyle(
                                product,
                                selectedUsers,
                              )}
                              title={getRatedByDisplay(product)}
                            />
                          ) : (
                            <div
                              className="contributors-grid"
                              style={{
                                gridTemplateColumns: `repeat(${selectedUsers.length}, minmax(0, 1fr))`,
                              }}
                            >
                              {selectedUsers.map((user) => {
                                const contributed = hasUserContributed(
                                  product,
                                  user.username,
                                );
                                const color = getUserColor(user);

                                return (
                                  <span
                                    key={`${product.id}-${user.id}`}
                                    className={`contributor-block ${
                                      contributed ? "active" : "inactive"
                                    }`}
                                    title={`${user.username}: ${
                                      contributed ? "rated" : "not rated"
                                    }`}
                                    style={{
                                      borderColor: color,
                                      backgroundColor: contributed
                                        ? color
                                        : "transparent",
                                      color: contributed ? "#ffffff" : color,
                                    }}
                                  >
                                    {getUserShortLabel(user.username)}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td style={getScoreCellStyle(product.avg_taste, 100)}>
                          {fmt(product.avg_taste, isMobile)}
                        </td>
                        <td style={getScoreCellStyle(product.avg_value, 20)}>
                          {fmt(product.avg_value, isMobile)}
                        </td>
                        <td
                          style={getScoreCellStyle(
                            extraMetricValue(product),
                            10,
                          )}
                        >
                          {fmt(extraMetricValue(product), isMobile)}
                        </td>
                        <td style={getScoreCellStyle(product.avg_packaging, 5)}>
                          {fmt(product.avg_packaging, isMobile)}
                        </td>
                        <td style={getScoreCellStyle(product.avg_overall, 100)}>
                          {fmt(product.avg_overall, isMobile)}
                        </td>
                      </tr>

                      {showDetails &&
                        hasMultipleRatings &&
                        product.ratings.map((rating) => {
                          const user = selectedUsers.find(
                            (u) => u.username === rating.user,
                          );
                          const userColor = user
                            ? getUserColor(user)
                            : "#7c5cff";

                          return (
                            <tr
                              key={`${product.id}-${rating.user_id}`}
                              className={`detail-row ${
                                isClosing ? "closing" : "opening"
                              }`}
                            >
                              <td
                                style={{
                                  fontSize: "0.9em",
                                  color: userColor,
                                  fontWeight: "bold",
                                }}
                              >
                                {rating.user}
                              </td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td style={getScoreCellStyle(rating.taste, 100)}>
                                {fmt(rating.taste, isMobile)}
                              </td>
                              <td style={getScoreCellStyle(rating.value, 20)}>
                                {fmt(rating.value, isMobile)}
                              </td>
                              <td
                                style={getScoreCellStyle(
                                  extraDetailValue(rating),
                                  10,
                                )}
                              >
                                {fmt(extraDetailValue(rating), isMobile)}
                              </td>
                              <td
                                style={getScoreCellStyle(rating.packaging, 5)}
                              >
                                {fmt(rating.packaging, isMobile)}
                              </td>
                              <td
                                style={getScoreCellStyle(rating.overall, 100)}
                              >
                                {fmt(rating.overall, isMobile)}
                              </td>
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className={`rating-sheet playful-card ${
          isDraggingSheet ? "dragging" : ""
        } ${sheetHeight <= COLLAPSED_SHEET_HEIGHT + 2 ? "collapsed" : ""}`}
        style={{ height: `${sheetHeight}px` }}
      >
        <form onSubmit={submitRating}>
          <button
            type="button"
            className="rating-sheet-handle"
            onPointerDown={onSheetPointerDown}
            onClick={onSheetHandleClick}
            aria-label="Drag rating panel"
            style={{
              background: `${config.accent}12`,
              borderColor: `${config.accent}55`,
              color: config.accent,
            }}
          >
            <span
              className="rating-sheet-grip"
              style={{ background: config.accent }}
            />
            <span>{`Rate a ${config.label}`}</span>
          </button>

          <label htmlFor="sheet-product-search">{config.label}</label>
          <div className="search-field">
            <input
              id="sheet-product-search"
              ref={nameInputRef}
              type="text"
              placeholder={`Search ${config.label.toLowerCase()}`}
              value={ratingForm.nameQuery}
              onKeyDown={(event) => handleRateFieldKeyDown(event, "name")}
              onFocus={() => setActiveSearchInput("name")}
              onBlur={() =>
                setTimeout(
                  () =>
                    setActiveSearchInput((current) =>
                      current === "name" ? null : current,
                    ),
                  100,
                )
              }
              onChange={(event) => {
                setActiveSearchInput("name");
                updateRatingField("nameQuery", event.target.value);
              }}
            />

            {activeSearchInput === "name" &&
              filteredProductSuggestions.length > 0 && (
                <ul
                  className="search-suggestions"
                  role="listbox"
                  aria-label={`${config.label} suggestions`}
                >
                  {filteredProductSuggestions.map((productName) => (
                    <li key={productName}>
                      <button
                        type="button"
                        className="search-suggestion-item"
                        onMouseDown={(event) => {
                          event.preventDefault();

                          const selected = productCatalog.find(
                            (candidate) => candidate.name === productName,
                          );

                          if (selected) {
                            applySelectedProduct(selected);
                          } else {
                            updateRatingField("nameQuery", productName);
                          }

                          dismissRateKeyboard();
                        }}
                      >
                        {productName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          <label htmlFor="sheet-producer-search">{config.bucketLabel}</label>
          <div className="search-field">
            <input
              id="sheet-producer-search"
              ref={producerInputRef}
              type="text"
              placeholder={`Search ${config.bucketLabel.toLowerCase()}`}
              value={ratingForm.producerQuery}
              onKeyDown={(event) =>
                handleRateFieldKeyDown(event, "producer")
              }
              onFocus={() => setActiveSearchInput("producer")}
              onBlur={() =>
                setTimeout(
                  () =>
                    setActiveSearchInput((current) =>
                      current === "producer" ? null : current,
                    ),
                  100,
                )
              }
              onChange={(event) => {
                setActiveSearchInput("producer");
                updateRatingField("producerQuery", event.target.value);
              }}
            />

            {activeSearchInput === "producer" &&
              filteredProducerSuggestions.length > 0 && (
                <ul
                  className="search-suggestions"
                  role="listbox"
                  aria-label={`${config.bucketLabel} suggestions`}
                >
                  {filteredProducerSuggestions.map((producer) => (
                    <li key={producer}>
                      <button
                        type="button"
                        className="search-suggestion-item"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          updateRatingField("producerQuery", producer);
                          setActiveSearchInput(null);
                        }}
                      >
                        {producer}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>
          {config.key === "wine" ? (
            <>
              <label htmlFor="sheet-country">Country</label>
              <div className="search-field">
                <input
                  id="sheet-country"
                  ref={countryInputRef}
                  type="text"
                  placeholder="Search country"
                  value={ratingForm.countryQuery}
                  onKeyDown={(event) =>
                    handleRateFieldKeyDown(event, "country")
                  }
                  onFocus={() => setActiveSearchInput("country")}
                  onBlur={() =>
                    setTimeout(
                      () =>
                        setActiveSearchInput((current) =>
                          current === "country" ? null : current,
                        ),
                      100,
                    )
                  }
                  onChange={(event) => {
                    setActiveSearchInput("country");
                    updateRatingField("countryQuery", event.target.value);
                  }}
                />

                {activeSearchInput === "country" &&
                  filteredCountrySuggestions.length > 0 && (
                    <ul
                      className="search-suggestions"
                      role="listbox"
                      aria-label="Country suggestions"
                    >
                      {filteredCountrySuggestions.map((country) => (
                        <li key={country}>
                          <button
                            type="button"
                            className="search-suggestion-item"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              updateRatingField("countryQuery", country);
                              setActiveSearchInput(null);
                            }}
                          >
                            {country}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </>
          ) : null}

          <label htmlFor="sheet-style">Style</label>
          <div className="search-field">
            <input
              id="sheet-style"
              ref={styleInputRef}
              type="text"
              placeholder="Search style"
              value={ratingForm.styleQuery}
              onKeyDown={(event) => handleRateFieldKeyDown(event, "style")}
              onFocus={() => setActiveSearchInput("style")}
              onBlur={() =>
                setTimeout(
                  () =>
                    setActiveSearchInput((current) =>
                      current === "style" ? null : current,
                    ),
                  100,
                )
              }
              onChange={(event) => {
                setActiveSearchInput("style");
                updateRatingField("styleQuery", event.target.value);
              }}
            />

            {activeSearchInput === "style" &&
              filteredStyleSuggestions.length > 0 && (
                <ul
                  className="search-suggestions"
                  role="listbox"
                  aria-label="Style suggestions"
                >
                  {filteredStyleSuggestions.map((style) => (
                    <li key={style}>
                      <button
                        type="button"
                        className="search-suggestion-item"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          updateRatingField("styleQuery", style);
                          setActiveSearchInput(null);
                        }}
                      >
                        {style}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          <label>Type</label>
          <div
            className="type-select-row"
            role="group"
            aria-label={`${config.label} type`}
          >
            {config.typeOptions.map((typeOption) => {
              const normalizedOption = normalizeBeerType(typeOption);
              const selected =
                normalizeBeerType(ratingForm.typeQuery) === normalizedOption;

              return (
                <button
                  key={typeOption}
                  type="button"
                  className={`type-select-box ${selected ? "selected" : ""}`}
                  onClick={() =>
                    updateRatingField("typeQuery", selected ? "" : typeOption)
                  }
                >
                  {typeOption}
                </button>
              );
            })}
          </div>

          <p className="rating-sheet-match">
            {selectedProductForRating
              ? `Selected: ${selectedProductForRating.name} — ${selectedProductForRating.producer}`
              : `${matchedProducts.length} matching ${config.plural}`}
          </p>

          <ScorePickerStyles />
          <div className="rating-sheet-grid">
            <label>
              Taste (0-100)
              <div className="rating-score-row">
                <ScoreBucketPicker
                  value={ratingForm.taste}
                  min={0}
                  max={100}
                  accent={config.accent}
                  points={TASTE_SCALE_WORDS}
                  onSelect={(v) => updateRatingField("taste", v)}
                />
              </div>
            </label>

            <label>
              Value (0-20)
              <div className="rating-score-row">
                <ScoreBucketPicker
                  value={ratingForm.value}
                  min={0}
                  max={20}
                  accent={config.accent}
                  points={VALUE_SCALE_WORDS}
                  onSelect={(v) => updateRatingField("value", v)}
                />
              </div>
            </label>

            <label>
              {config.extraMetricLabel} (0-10)
              <div className="rating-score-row">
                <ScoreBucketPicker
                  value={ratingForm[config.extraFormKey]}
                  min={0}
                  max={10}
                  accent={config.accent}
                  points={config.extraScaleWords}
                  onSelect={(v) => updateRatingField(config.extraFormKey, v)}
                />
              </div>
            </label>

            <label>
              Packaging (0-5)
              <div className="rating-score-row">
                <ScoreBucketPicker
                  value={ratingForm.packaging}
                  min={0}
                  max={5}
                  accent={config.accent}
                  points={PACKAGING_SCALE_WORDS}
                  onSelect={(v) => updateRatingField("packaging", v)}
                />
              </div>
            </label>
          </div>

          <div className="rating-sheet-actions">
            <button type="submit" disabled={savingRating}>
              {savingRating ? "Saving..." : "Save Rating"}
            </button>
            {ratingError && <p className="error">{ratingError}</p>}
          </div>
        </form>
      </section>

      {toastMessage && (
        <div className="toast-stack">
          <div className={`rating-toast ${toastType}`}>{toastMessage}</div>
        </div>
      )}
    </main>
  );
}

export default TablePage;
