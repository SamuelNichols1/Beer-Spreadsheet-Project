import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import TablePage from "./pages/TablePage";
import UnseenRatingsPopup from "./components/UnseenRatingsPopup";

function normalizeHexColor(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

async function getDeviceFingerprint() {
  const values = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || "",
    navigator.deviceMemory || "",
  ].join("|");

  if (!window.crypto?.subtle) return values;

  const bytes = new TextEncoder().encode(values);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

const BEVERAGE_CONFIG = {
  beer: {
    key: "beer",
    label: "Beer",
    pluralLabel: "beers",
    emoji: "🍺",
    accent: "#6f5ef5",
    listEndpoint: "/beers/",
    ratingsEndpoint: "/beers_with_ratings/",
    averageEndpoint: "/beers_with_average_ratings/",
    rateEndpoint: "/rate_beer/",
    storageKeys: {
      list: "beerList",
      ratings: "beerListWithRatings",
      average: "beerListWithAverageRatings",
    },
  },
  cider: {
    key: "cider",
    label: "Cider",
    pluralLabel: "ciders",
    emoji: "🍏",
    accent: "#198754",
    listEndpoint: "/ciders/",
    ratingsEndpoint: "/ciders_with_ratings/",
    averageEndpoint: "/ciders_with_average_ratings/",
    rateEndpoint: "/rate_cider/",
    storageKeys: {
      list: "ciderList",
      ratings: "ciderListWithRatings",
      average: "ciderListWithAverageRatings",
    },
  },
  wine: {
    key: "wine",
    label: "Wine",
    pluralLabel: "wines",
    emoji: "🍷",
    accent: "#a14373",
    listEndpoint: "/wines/",
    ratingsEndpoint: "/wines_with_ratings/",
    averageEndpoint: "/wines_with_average_ratings/",
    rateEndpoint: "/rate_wine/",
    storageKeys: {
      list: "wineList",
      ratings: "wineListWithRatings",
      average: "wineListWithAverageRatings",
    },
  },
};

function App() {
  const BEER_LIST_KEY = "beerList";
  const BEER_LIST_WITH_RATINGS_KEY = "beerListWithRatings";
  const BEER_LIST_WITH_AVERAGE_RATINGS_KEY = "beerListWithAverageRatings";
  const CIDER_LIST_KEY = "ciderList";
  const CIDER_LIST_WITH_RATINGS_KEY = "ciderListWithRatings";
  const CIDER_LIST_WITH_AVERAGE_RATINGS_KEY = "ciderListWithAverageRatings";
  const WINE_LIST_KEY = "wineList";
  const WINE_LIST_WITH_RATINGS_KEY = "wineListWithRatings";
  const WINE_LIST_WITH_AVERAGE_RATINGS_KEY = "wineListWithAverageRatings";
  const USERS_LIST_KEY = "usersList";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [savedToken, setSavedToken] = useState(
    localStorage.getItem("authToken") || "",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("authToken")),
  );
  const [authChecking, setAuthChecking] = useState(true);
  const [myColor, setMyColor] = useState("#7c5cff");
  const [savingColor, setSavingColor] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  async function readJsonSafe(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const textBody = await response.text();
      throw new Error(
        `Expected JSON from API but received ${contentType || "unknown content type"}. Check VITE_API_BASE_URL. Response starts with: ${textBody.slice(0, 60)}`,
      );
    }
    return response.json();
  }

  async function readErrorDetail(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const data = await response.json();
        return data?.detail || data?.non_field_errors?.[0] || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  async function initializeCsrf() {
    const csrfResponse = await fetch(`${apiBaseUrl}/csrf/`, {
      method: "GET",
      credentials: "include",
    });

    if (!csrfResponse.ok) {
      throw new Error("Failed to initialize CSRF token");
    }

    const csrfData = await readJsonSafe(csrfResponse);
    const token = csrfData?.csrfToken || "";

    if (!token) {
      throw new Error("CSRF token was not returned by API");
    }

    setCsrfToken(token);
    return token;
  }

  async function fetchAndStoreBeverageData(token, beverageKey) {
    const config = BEVERAGE_CONFIG[beverageKey] || BEVERAGE_CONFIG.beer;
    const normalizedToken = typeof token === "string" ? token.trim() : "";
    if (!normalizedToken) {
      throw new Error("Missing auth token. Please sign in again.");
    }

    const headers = {
      Authorization: `Token ${normalizedToken}`,
    };

    const [
      listResponse,
      ratingsResponse,
      averageRatingsResponse,
      usersResponse,
    ] = await Promise.all([
      fetch(`${apiBaseUrl}${config.listEndpoint}`, { method: "GET", headers }),
      fetch(`${apiBaseUrl}${config.ratingsEndpoint}`, {
        method: "GET",
        headers,
      }),
      fetch(`${apiBaseUrl}${config.averageEndpoint}`, {
        method: "GET",
        headers,
      }),
      fetch(`${apiBaseUrl}/users/`, { method: "GET", headers }),
    ]);

    if (
      !listResponse.ok ||
      !ratingsResponse.ok ||
      !averageRatingsResponse.ok ||
      !usersResponse.ok
    ) {
      const authFailure =
        listResponse.status === 401 ||
        ratingsResponse.status === 401 ||
        averageRatingsResponse.status === 401 ||
        usersResponse.status === 401;

      const firstErrorDetail =
        (await readErrorDetail(listResponse)) ||
        (await readErrorDetail(ratingsResponse)) ||
        (await readErrorDetail(averageRatingsResponse)) ||
        (await readErrorDetail(usersResponse));

      if (authFailure) {
        throw new Error(
          firstErrorDetail || "Authentication failed. Please sign in again.",
        );
      }

      throw new Error(
        firstErrorDetail || `Failed to fetch ${config.label} data`,
      );
    }

    const list = await readJsonSafe(listResponse);
    const listWithRatings = await readJsonSafe(ratingsResponse);
    const listWithAverageRatings = await readJsonSafe(averageRatingsResponse);
    const usersList = await readJsonSafe(usersResponse);

    localStorage.setItem(config.storageKeys.list, JSON.stringify(list));
    localStorage.setItem(
      config.storageKeys.ratings,
      JSON.stringify(listWithRatings),
    );
    localStorage.setItem(
      config.storageKeys.average,
      JSON.stringify(listWithAverageRatings),
    );
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(usersList));
  }

  const [unseenRatings, setUnseenRatings] = useState([]);
  const [showUnseenPopup, setShowUnseenPopup] = useState(false);
  const [toasts, setToasts] = useState([]);
  const isFirstFetch = useRef(true);
  const toastIdCounter = useRef(0);
  const isFetching = useRef(false);
  const shownRatingIds = useRef(new Set());

  // Auto-dismiss toasts after 10 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 10000),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts]);

  // Fetch unseen ratings every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnseenRatings = async () => {
      if (isFetching.current) return; // Prevent concurrent fetches

      isFetching.current = true;
      const token = localStorage.getItem("authToken") || "";
      if (!token) {
        isFetching.current = false;
        return;
      }

      try {
        var results = [];
        for (var i = 0; i < 3; i++) {
          var categories = ["beer", "wine", "cider"];
          console.log(categories[i]);
          const res = await fetch(
            `${apiBaseUrl}/unseen_${categories[i]}_ratings/`,
            {
              method: "GET",
              headers: { Authorization: `Token ${token}` },
            },
          );

          if (!res.ok) {
            isFetching.current = false;
            return;
          }
        }

        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          results += data.results;
        }

        if (Array.isArray(data.results) && data.results.length > 0) {
          // Add new ratings to existing list, avoiding duplicates by ID
          setUnseenRatings((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newRatings = data.results.filter(
              (r) => !existingIds.has(r.id),
            );

            if (newRatings.length > 0) {
              // Show popup on first load, toast on subsequent polls
              if (isFirstFetch.current) {
                setShowUnseenPopup(true);
                // Mark all ratings in popup as shown
                newRatings.forEach((r) => shownRatingIds.current.add(r.id));
              } else {
                // Only create toasts for ratings we haven't shown yet
                const ratingsToShow = newRatings.filter(
                  (r) => !shownRatingIds.current.has(r.id),
                );

                if (ratingsToShow.length > 0) {
                  const newToasts = ratingsToShow.map((rating) => {
                    shownRatingIds.current.add(rating.id);
                    return {
                      id: toastIdCounter.current++,
                      message: `${rating.user?.username || "Someone"} rated ${rating.beer?.name} a ${rating.overall}`,
                    };
                  });
                  setToasts((prev) => [...prev, ...newToasts]);
                }
              }
            }

            return [...prev, ...newRatings];
          });
        }

        isFirstFetch.current = false;
      } catch {
        // Silently fail
      } finally {
        isFetching.current = false;
      }
    };

    // Fetch immediately on mount
    fetchUnseenRatings();

    // Then fetch every 10 seconds
    const interval = setInterval(fetchUnseenRatings, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, apiBaseUrl]);

  useEffect(() => {
    async function bootstrapAuth() {
      let tokenFromStorage = localStorage.getItem("authToken") || "";

      if (!tokenFromStorage) {
        try {
          const fingerprint = await getDeviceFingerprint();
          const deviceResponse = await fetch(`${apiBaseUrl}/device-auth/`, {
            method: "GET",
            credentials: "include",
            headers: { "X-Device-Fingerprint": fingerprint },
          });

          if (deviceResponse.ok) {
            const deviceData = await readJsonSafe(deviceResponse);
            tokenFromStorage = deviceData?.token || "";
            if (tokenFromStorage) {
              localStorage.setItem("authToken", tokenFromStorage);
            }
          }
        } catch {
          // A missing remembered device or unavailable API falls back to login.
        }
      }

      try {
        await initializeCsrf();
      } catch {
        setError(
          "Unable to initialize CSRF. Check that the API server is running.",
        );
      }

      if (tokenFromStorage) {
        setSavedToken(tokenFromStorage);
        isFirstFetch.current = true;
        shownRatingIds.current = new Set();
        setIsAuthenticated(true);

        try {
          await Promise.all([
            fetchAndStoreBeverageData(tokenFromStorage, "beer"),
            fetchAndStoreBeverageData(tokenFromStorage, "cider"),
            fetchAndStoreBeverageData(tokenFromStorage, "wine"),
          ]);
        } catch (err) {
          // Only clear token on actual authentication failures, not network errors
          const isAuthError =
            err?.message?.toLowerCase().includes("authentication") ||
            err?.message?.toLowerCase().includes("sign in again");

          if (isAuthError) {
            localStorage.removeItem("authToken");
            localStorage.removeItem(BEER_LIST_KEY);
            localStorage.removeItem(BEER_LIST_WITH_RATINGS_KEY);
            localStorage.removeItem(BEER_LIST_WITH_AVERAGE_RATINGS_KEY);
            localStorage.removeItem(USERS_LIST_KEY);
            setSavedToken("");
            setIsAuthenticated(false);
            setError(err?.message || "Session expired. Please sign in again.");
          } else {
            // Keep the token for non-auth errors (network issues, etc.)
            console.warn(
              "Failed to fetch data but keeping auth token:",
              err?.message,
            );
          }
        }
      }

      setAuthChecking(false);
    }

    bootstrapAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = localStorage.getItem("authToken") || "";
    if (!token) {
      return;
    }

    fetch(`${apiBaseUrl}/my-color/`, {
      method: "GET",
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const color = normalizeHexColor(data?.color);
        if (color) {
          setMyColor(color);
        }
      })
      .catch(() => {});
  }, [apiBaseUrl, isAuthenticated]);

  async function saveMyColor() {
    const token = localStorage.getItem("authToken") || "";
    const color = normalizeHexColor(myColor);
    if (!token || !color) {
      return;
    }

    setSavingColor(true);
    try {
      const response = await fetch(`${apiBaseUrl}/my-color/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ color }),
      });

      if (!response.ok) {
        throw new Error("Failed to save color");
      }

      const payload = await response.json();
      const savedColor = normalizeHexColor(payload?.color);
      if (!savedColor) {
        return;
      }

      setMyColor(savedColor);

      const existingUsers = (() => {
        try {
          const raw = localStorage.getItem(USERS_LIST_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();

      const updatedUsers = existingUsers.map((user) => {
        if (user?.username === payload?.username) {
          return { ...user, color: savedColor };
        }
        return user;
      });
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updatedUsers));
    } catch {
      setError("Failed to save color");
    } finally {
      setSavingColor(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isAuthenticated) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = csrfToken || (await initializeCsrf());
      const fingerprint = await getDeviceFingerprint();

      const response = await fetch(`${apiBaseUrl}/api-token-auth/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Fingerprint": fingerprint,
          ...(token ? { "X-CSRFToken": token } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await readJsonSafe(response);

      if (!response.ok) {
        throw new Error(
          data?.non_field_errors?.[0] || data?.detail || "Login failed",
        );
      }

      if (!data?.token) {
        throw new Error("No token returned from API");
      }

      localStorage.setItem("authToken", data.token);
      setSavedToken(data.token);
      isFirstFetch.current = true;
      shownRatingIds.current = new Set();
      await Promise.all([
        fetchAndStoreBeverageData(data.token, "beer"),
        fetchAndStoreBeverageData(data.token, "cider"),
        fetchAndStoreBeverageData(data.token, "wine"),
      ]);
      setIsAuthenticated(true);
      setPassword("");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function clearToken() {
    getDeviceFingerprint().then((fingerprint) =>
      fetch(`${apiBaseUrl}/device-logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
          "X-Device-Fingerprint": fingerprint,
        },
      }).catch(() => {}),
    );
    localStorage.removeItem("authToken");
    localStorage.removeItem(BEER_LIST_KEY);
    localStorage.removeItem(BEER_LIST_WITH_RATINGS_KEY);
    localStorage.removeItem(BEER_LIST_WITH_AVERAGE_RATINGS_KEY);
    localStorage.removeItem(CIDER_LIST_KEY);
    localStorage.removeItem(CIDER_LIST_WITH_RATINGS_KEY);
    localStorage.removeItem(CIDER_LIST_WITH_AVERAGE_RATINGS_KEY);
    localStorage.removeItem(WINE_LIST_KEY);
    localStorage.removeItem(WINE_LIST_WITH_RATINGS_KEY);
    localStorage.removeItem(WINE_LIST_WITH_AVERAGE_RATINGS_KEY);
    localStorage.removeItem(USERS_LIST_KEY);
    setSavedToken("");
    setIsAuthenticated(false);
  }

  if (authChecking) {
    return (
      <main className="page">
        <section className="login-card playful-card">
          <p>Checking sign-in...</p>
        </section>
      </main>
    );
  }

  return (
    <>
      {showUnseenPopup && unseenRatings.length > 0 && (
        <UnseenRatingsPopup
          ratings={unseenRatings}
          onClose={() => {
            setShowUnseenPopup(false);
            setUnseenRatings([]);
          }}
        />
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/beer-table" replace />} />

        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <main className="page">
                <section className="login-card playful-card">
                  <h1>Welcome back 🍻</h1>
                  <p>You are signed in.</p>
                  <div className="my-color-row">
                    <label htmlFor="my-color-picker-home">My Color</label>
                    <input
                      id="my-color-picker-home"
                      type="color"
                      value={myColor}
                      onChange={(event) => setMyColor(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={saveMyColor}
                      disabled={savingColor}
                    >
                      {savingColor ? "Saving..." : "Save Color"}
                    </button>
                  </div>
                  <div className="actions-row">
                    <Link className="link-button" to="/beer-table">
                      Beer Table
                    </Link>
                    <Link className="link-button" to="/cider-table">
                      Cider Table
                    </Link>
                    <Link className="link-button" to="/wine-table">
                      Wine Table
                    </Link>
                    <button type="button" onClick={clearToken}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="token-card playful-card">
                  <h2>Saved Token</h2>
                  {savedToken ? (
                    <p className="token">{savedToken}</p>
                  ) : (
                    <p>No token saved yet.</p>
                  )}
                  <button
                    type="button"
                    onClick={clearToken}
                    disabled={!savedToken}
                  >
                    Clear token
                  </button>
                </section>
              </main>
            ) : (
              <Navigate to="/table" replace />
            )
          }
        />

        <Route
          path="/beer-table"
          element={
            isAuthenticated ? (
              <TablePage onSignOut={clearToken} beverage="beer" />
            ) : (
              <main className="page">
                <form
                  className="login-card playful-card"
                  onSubmit={handleSubmit}
                >
                  <h1>Login</h1>

                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />

                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button type="submit" disabled={loading || isAuthenticated}>
                    {loading ? "Signing in..." : "Sign in"}
                  </button>

                  {error && <p className="error">{error}</p>}
                </form>
              </main>
            )
          }
        />

        <Route
          path="/cider-table"
          element={
            isAuthenticated ? (
              <TablePage onSignOut={clearToken} beverage="cider" />
            ) : (
              <main className="page">
                <form
                  className="login-card playful-card"
                  onSubmit={handleSubmit}
                >
                  <h1>Login</h1>

                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />

                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button type="submit" disabled={loading || isAuthenticated}>
                    {loading ? "Signing in..." : "Sign in"}
                  </button>

                  {error && <p className="error">{error}</p>}
                </form>
              </main>
            )
          }
        />

        <Route
          path="/wine-table"
          element={
            isAuthenticated ? (
              <TablePage onSignOut={clearToken} beverage="wine" />
            ) : (
              <main className="page">
                <form
                  className="login-card playful-card"
                  onSubmit={handleSubmit}
                >
                  <h1>Login</h1>

                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />

                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button type="submit" disabled={loading || isAuthenticated}>
                    {loading ? "Signing in..." : "Sign in"}
                  </button>

                  {error && <p className="error">{error}</p>}
                </form>
              </main>
            )
          }
        />

        <Route path="/table" element={<Navigate to="/beer-table" replace />} />
        <Route path="*" element={<Navigate to="/beer-table" replace />} />
      </Routes>

      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((toast) => (
            <div key={toast.id} className="rating-toast success">
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default App;
