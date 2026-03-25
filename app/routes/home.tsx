import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Meeting Rooms — Choose a Design" },
    { name: "description", content: "5 unique meeting room booking interfaces" },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap",
  },
];

const designs = [
  {
    path: "/1",
    name: "Brutalist",
    description: "Raw concrete, thick borders, monospace type, overlapping elements",
    color: "#FF0000",
    bg: "#1a1a1a",
  },
  {
    path: "/2",
    name: "Art Deco",
    description: "Gold & black, geometric patterns, luxury theater elegance",
    color: "#D4AF37",
    bg: "#0A0A0A",
  },
  {
    path: "/3",
    name: "Organic",
    description: "Soft blobs, earthy pastels, flowing nature-inspired warmth",
    color: "#7C9070",
    bg: "#FAF7F2",
  },
  {
    path: "/4",
    name: "Terminal",
    description: "CRT green-on-black, scanlines, retro sci-fi command line",
    color: "#00FF41",
    bg: "#0D0D0D",
  },
  {
    path: "/5",
    name: "Swiss Editorial",
    description: "Strict grid, red accent, typographic precision, maximum restraint",
    color: "#FF2D2D",
    bg: "#FFFFFF",
  },
  {
    path: "/6",
    name: "Clean Cards",
    description: "Practical card grid with timeline bars, focused on clarity and usability",
    color: "#3B82F6",
    bg: "#F6F7F9",
  },
  {
    path: "/7",
    name: "Timeline",
    description: "Full-width Gantt chart with all rooms visible, color-coded booking blocks",
    color: "#6366F1",
    bg: "#FFFFFF",
  },
  {
    path: "/8",
    name: "Agenda",
    description: "Single-column list view — what's happening now, coming up, and available",
    color: "#0D9488",
    bg: "#FFFFFF",
  },
  {
    path: "/9",
    name: "Floor Plan",
    description: "Spatial map view with rooms positioned by floor, slide-out detail panel",
    color: "#F97316",
    bg: "#FAFAF8",
  },
  {
    path: "/10",
    name: "Spreadsheet",
    description: "Dense data table — rooms as columns, hours as rows, inline booking",
    color: "#18181B",
    bg: "#FFFFFF",
  },
];

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F3EF",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(48px, 8vw, 96px)",
            fontWeight: 400,
            color: "#1a1a1a",
            margin: 0,
            lineHeight: 1,
          }}
        >
          Meeting Rooms
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#666",
            marginTop: 16,
            letterSpacing: "0.02em",
          }}
        >
          Ten unique designs — pick one to explore
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          maxWidth: 1200,
          width: "100%",
        }}
      >
        {designs.map((d, i) => (
          <Link
            key={d.path}
            to={d.path}
            style={{
              textDecoration: "none",
              color: "inherit",
              animation: `homeCardIn 0.5s ease both`,
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e0ddd8",
                padding: 0,
                overflow: "hidden",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  height: 120,
                  background: d.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 64,
                    fontWeight: 400,
                    color: d.color,
                    opacity: 0.9,
                    lineHeight: 1,
                  }}
                >
                  {i + 1}
                </span>
              </div>
              <div style={{ padding: "20px 24px 24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: 28,
                      fontWeight: 400,
                      margin: 0,
                      color: "#1a1a1a",
                    }}
                  >
                    {d.name}
                  </h2>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#999",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    /{i + 1}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "#777",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {d.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes homeCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
