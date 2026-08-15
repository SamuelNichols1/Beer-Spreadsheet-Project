import { useEffect, useMemo, useState, Fragment } from "react";
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

function getRatingInputStyle(value, maxValue) {
  return {
    ...(getScoreCellStyle(Number(value), maxValue) || {}),
    transition: "background-color 120ms ease",
  };
}

function ScaleHint({ value, points }) {
  const numeric = Math.max(
    points[0].value,
    Math.min(points[points.length - 1].value, Number(value) || 0),
  );

  let closestIdx = 0;
  let minDistance = Math.abs(numeric - points[0].value);
  for (let i = 1; i < points.length; i += 1) {
    const distance = Math.abs(numeric - points[i].value);
    if (
      distance < minDistance ||
      (distance === minDistance && points[i].value > points[closestIdx].value)
    ) {
      closestIdx = i;
      minDistance = distance;
    }
  }

  let startIdx = closestIdx - 1;
  let endIdx = closestIdx + 1;
  if (startIdx < 0) {
    startIdx = 0;
    endIdx = Math.min(points.length - 1, 2);
  } else if (endIdx >= points.length) {
    endIdx = points.length - 1;
    startIdx = Math.max(0, points.length - 3);
  }
  const windowPoints = points.slice(startIdx, endIdx + 1);

  const winMin = windowPoints[0].value;
  const winMax = windowPoints[windowPoints.length - 1].value;
  const winRange = winMax - winMin || 1;
  const maxValue = points[points.length - 1].value;
  const arrowPct = ((numeric - winMin) / winRange) * 100;

  return (
    <span className="rating-word-scale" aria-hidden="true">
      <span
        className="rating-word-scale-arrow"
        style={{ left: `${arrowPct}%` }}
      >
        &#x25BC;
      </span>
      {windowPoints.map((point, idx) => {
        const pct = ((point.value - winMin) / winRange) * 100;
        const isFirst = idx === 0;
        const isLast = idx === windowPoints.length - 1;
        const xTransform = isFirst
          ? "translateX(0%)"
          : isLast
            ? "translateX(-100%)"
            : "translateX(-50%)";
        return (
          <span
            key={point.label}
            className="rating-word-scale-pill"
            style={{
              left: `${pct}%`,
              background: getScaleColor(point.value, maxValue),
              transform: xTransform,
            }}
          >
            {point.label}
          </span>
        );
      })}
    </span>
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
    typeQuery: "",
    taste: 0,
    value: 0,
    texture: 0,
    sessionability: 0,
    packaging: 0,
  });

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
      typeQuery: "",
      taste: 0,
      value: 0,
      texture: 0,
      sessionability: 0,
      packaging: 0,
    });
  }, [config.key, config.listRatingsKey]);

  const productCatalog = useMemo(
    () =>
      averageData
        .map((product) => ({
          id: product.id,
          name: String(product.name || ""),
          producer: String(product?.[config.productField] || ""),
          style: String(product.style || ""),
          type: String(product.type || ""),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [averageData, config.productField],
  );

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

  const matchedProducts = useMemo(() => {
    const producerQuery = ratingForm.producerQuery.trim().toLowerCase();
    const nameQuery = ratingForm.nameQuery.trim().toLowerCase();
    const styleQuery = ratingForm.styleQuery.trim().toLowerCase();
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
      const typeMatch = typeQuery
        ? normalizeBeerType(product.type) === typeQuery
        : true;

      return producerMatch && nameMatch && styleMatch && typeMatch;
    });
  }, [
    productCatalog,
    ratingForm.nameQuery,
    ratingForm.producerQuery,
    ratingForm.styleQuery,
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
    }));
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
              type="text"
              placeholder={`Search ${config.label.toLowerCase()}`}
              value={ratingForm.nameQuery}
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

                          setActiveSearchInput(null);
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
              type="text"
              placeholder={`Search ${config.bucketLabel.toLowerCase()}`}
              value={ratingForm.producerQuery}
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

          <label htmlFor="sheet-style">Style</label>
          <div className="search-field">
            <input
              id="sheet-style"
              type="text"
              placeholder="Search style"
              value={ratingForm.styleQuery}
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

          <div className="rating-sheet-grid">
            <label>
              Taste (0-100)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ratingForm.taste}
                  style={getRatingInputStyle(ratingForm.taste, 100)}
                  onChange={(event) =>
                    updateRatingField("taste", event.target.value)
                  }
                />
                <ScaleHint
                  value={ratingForm.taste}
                  points={TASTE_SCALE_WORDS}
                />
              </div>
            </label>

            <label>
              Value (0-20)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={ratingForm.value}
                  style={getRatingInputStyle(ratingForm.value, 20)}
                  onChange={(event) =>
                    updateRatingField("value", event.target.value)
                  }
                />
                <ScaleHint
                  value={ratingForm.value}
                  points={VALUE_SCALE_WORDS}
                />
              </div>
            </label>

            <label>
              {config.extraMetricLabel} (0-10)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={ratingForm[config.extraFormKey]}
                  style={getRatingInputStyle(
                    ratingForm[config.extraFormKey],
                    10,
                  )}
                  onChange={(event) =>
                    updateRatingField(config.extraFormKey, event.target.value)
                  }
                />
                <ScaleHint
                  value={ratingForm[config.extraFormKey]}
                  points={config.extraScaleWords}
                />
              </div>
            </label>

            <label>
              Packaging (0-5)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={ratingForm.packaging}
                  style={getRatingInputStyle(ratingForm.packaging, 5)}
                  onChange={(event) =>
                    updateRatingField("packaging", event.target.value)
                  }
                />
                <ScaleHint
                  value={ratingForm.packaging}
                  points={PACKAGING_SCALE_WORDS}
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
