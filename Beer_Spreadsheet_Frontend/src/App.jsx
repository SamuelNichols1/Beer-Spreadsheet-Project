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

function App() {
  const BEER_LIST_KEY = "beerList";
  const BEER_LIST_WITH_RATINGS_KEY = "beerListWithRatings";
  const BEER_LIST_WITH_AVERAGE_RATINGS_KEY = "beerListWithAverageRatings";
  const USERS_LIST_KEY = "usersList";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [savedToken, setSavedToken] = useState(
    localStorage.getItem("authToken") || "",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  async function fetchAndStoreBeerData(token) {
    const normalizedToken = typeof token === "string" ? token.trim() : "";
    if (!normalizedToken) {
      throw new Error("Missing auth token. Please sign in again.");
    }

    const headers = {
      Authorization: `Token ${normalizedToken}`,
    };

    const [
      beerListResponse,
      beerRatingsResponse,
      beerAverageRatingsResponse,
      usersResponse,
    ] = await Promise.all([
      fetch(`${apiBaseUrl}/beers/`, { method: "GET", headers }),
      fetch(`${apiBaseUrl}/beers_with_ratings/`, { method: "GET", headers }),
      fetch(`${apiBaseUrl}/beers_with_average_ratings/`, {
        method: "GET",
        headers,
      }),
      fetch(`${apiBaseUrl}/users/`, { method: "GET", headers }),
    ]);

    if (
      !beerListResponse.ok ||
      !beerRatingsResponse.ok ||
      !beerAverageRatingsResponse.ok ||
      !usersResponse.ok
    ) {
      const authFailure =
        beerListResponse.status === 401 ||
        beerRatingsResponse.status === 401 ||
        beerAverageRatingsResponse.status === 401 ||
        usersResponse.status === 401;

      const firstErrorDetail =
        (await readErrorDetail(beerListResponse)) ||
        (await readErrorDetail(beerRatingsResponse)) ||
        (await readErrorDetail(beerAverageRatingsResponse)) ||
        (await readErrorDetail(usersResponse));

      if (authFailure) {
        throw new Error(
          firstErrorDetail || "Authentication failed. Please sign in again.",
        );
      }

      throw new Error(firstErrorDetail || "Failed to fetch beer data");
    }

    const beerList = await readJsonSafe(beerListResponse);
    const beerListWithRatings = await readJsonSafe(beerRatingsResponse);
    const beerListWithAverageRatings = await readJsonSafe(
      beerAverageRatingsResponse,
    );
    const usersList = await readJsonSafe(usersResponse);

    localStorage.setItem(BEER_LIST_KEY, JSON.stringify(beerList));
    localStorage.setItem(
      BEER_LIST_WITH_RATINGS_KEY,
      JSON.stringify(beerListWithRatings),
    );
    localStorage.setItem(
      BEER_LIST_WITH_AVERAGE_RATINGS_KEY,
      JSON.stringify(beerListWithAverageRatings),
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
        const res = await fetch(`${apiBaseUrl}/unseen_ratings/`, {
          method: "GET",
          headers: { Authorization: `Token ${token}` },
        });

        if (!res.ok) {
          isFetching.current = false;
          return;
        }

        const data = await res.json();

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
      try {
        await initializeCsrf();
      } catch {
        setError(
          "Unable to initialize CSRF. Check that the API server is running.",
        );
      }

      const tokenFromStorage = localStorage.getItem("authToken") || "";

      if (tokenFromStorage) {
        setSavedToken(tokenFromStorage);
        isFirstFetch.current = true;
        shownRatingIds.current = new Set();
        setIsAuthenticated(true);

        try {
          await fetchAndStoreBeerData(tokenFromStorage);
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

      const response = await fetch(`${apiBaseUrl}/api-token-auth/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      await fetchAndStoreBeerData(data.token);
      setIsAuthenticated(true);
      setPassword("");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function clearToken() {
    localStorage.removeItem("authToken");
    localStorage.removeItem(BEER_LIST_KEY);
    localStorage.removeItem(BEER_LIST_WITH_RATINGS_KEY);
    localStorage.removeItem(BEER_LIST_WITH_AVERAGE_RATINGS_KEY);
    localStorage.removeItem(USERS_LIST_KEY);
    setSavedToken("");
    setIsAuthenticated(false);
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
        <Route path="/" element={<Navigate to="/table" replace />} />

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
                    <Link className="link-button" to="/table">
                      View Ratings Table
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
          path="/table"
          element={
            isAuthenticated ? (
              <TablePage onSignOut={clearToken} />
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

        <Route path="*" element={<Navigate to="/table" replace />} />
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
