import { useEffect } from "react";

export default function UnseenRatingsPopup({ ratings, onClose }) {
  useEffect(() => {
    if (!ratings || ratings.length === 0) return;
    // Prevent body scroll when popup is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ratings]);

  if (!ratings || ratings.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          background: "#fff",
          border: "2px solid #6f5ef5",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          maxWidth: "90vw",
          width: 500,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with close button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0 }}>What You've Missed</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#888",
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f0f0f0")}
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {ratings.map((r) => (
              <li
                key={r.id}
                style={{
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: "1px solid #eee",
                }}
              >
                <strong>{r.user?.username || "Someone"}</strong> rated{" "}
                <strong>{r.beer?.name}</strong> a <strong>{r.overall}</strong>
                <br />
                <span style={{ color: "#888", fontSize: 14 }}>
                  {r.beer?.brewery} ({r.beer?.type})
                </span>
                <br />
                <span style={{ color: "#aaa", fontSize: 12 }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
