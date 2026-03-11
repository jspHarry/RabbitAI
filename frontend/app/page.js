import UploadForm from "../components/UploadForm";

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed",
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "300px",
        background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Grid lines */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "48px", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          borderRadius: "20px",
          padding: "4px 14px",
          marginBottom: "24px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.1em",
          color: "var(--accent)",
          textTransform: "uppercase",
        }}>
          <span style={{
            width: "6px", height: "6px",
            borderRadius: "50%",
            background: "var(--accent)",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          AI-Powered · Groq Llama 3
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          marginBottom: "16px",
          background: "linear-gradient(135deg, #f0ede6 0%, #a8a8a8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Sales Insight<br />
          <span style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Automator</span>
        </h1>

        <p style={{
          fontSize: "16px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontWeight: 300,
          letterSpacing: "0.01em",
          maxWidth: "480px",
          margin: "0 auto",
          lineHeight: 1.6,
        }}>
          Upload your CSV or Excel file. Our AI engine distills it into<br />
          an executive briefing and delivers it straight to your inbox.
        </p>
      </header>

      <UploadForm />

      {/* Footer */}
      <footer style={{
        marginTop: "56px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-dim)",
        letterSpacing: "0.08em",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        RABBITT AI &nbsp;·&nbsp; SALES INTELLIGENCE PLATFORM &nbsp;·&nbsp; v1.0.0
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
