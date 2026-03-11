"use client";

import { useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STATES = { IDLE: "idle", LOADING: "loading", SUCCESS: "success", ERROR: "error" };

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(STATES.IDLE);
  const [message, setMessage] = useState("");
  const [rowsAnalyzed, setRowsAnalyzed] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
      setStatus(STATES.ERROR);
      setMessage("Only .csv and .xlsx files are accepted.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setStatus(STATES.ERROR);
      setMessage("File exceeds 10 MB limit.");
      return;
    }
    setFile(f);
    setStatus(STATES.IDLE);
    setMessage("");
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async () => {
    if (!file) { setStatus(STATES.ERROR); setMessage("Please select a file first."); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus(STATES.ERROR); setMessage("Please enter a valid email address."); return;
    }

    setStatus(STATES.LOADING);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", email);

      const headers = {};
      if (process.env.NEXT_PUBLIC_API_KEY) {
        headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY;
      }

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus(STATES.SUCCESS);
      setMessage(data.message);
      setRowsAnalyzed(data.rowsAnalyzed);
    } catch (err) {
      setStatus(STATES.ERROR);
      setMessage(err.message || "Failed to process your file. Please try again.");
    }
  };

  const reset = () => {
    setFile(null); setEmail(""); setStatus(STATES.IDLE);
    setMessage(""); setRowsAnalyzed(null);
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: "520px",
      position: "relative",
      zIndex: 1,
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "32px",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 24px 48px rgba(0,0,0,0.5)",
      }}>

        {status === STATES.SUCCESS ? (
          <SuccessState message={message} rowsAnalyzed={rowsAnalyzed} email={email} onReset={reset} />
        ) : (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                border: `1px dashed ${dragOver ? "var(--accent)" : file ? "var(--success)" : "var(--border-hover)"}`,
                borderRadius: "8px",
                padding: "32px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "var(--accent-dim)" : file ? "rgba(16,185,129,0.05)" : "var(--surface-2)",
                transition: "all 0.15s ease",
                marginBottom: "20px",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {file ? (
                <>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>✓</div>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--success)",
                    wordBreak: "break-all",
                  }}>
                    {file.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}>
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.4 }}>⬆</div>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
                    Drop your file here, or <span style={{ color: "var(--accent)" }}>browse</span>
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    marginTop: "8px",
                    letterSpacing: "0.08em",
                  }}>
                    .CSV · .XLSX · MAX 10 MB
                  </div>
                </>
              )}
            </div>

            {/* Email input */}
            <label style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              Recipient Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="executive@company.com"
              disabled={status === STATES.LOADING}
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "12px 14px",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                outline: "none",
                marginBottom: "24px",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />

            {/* Error message */}
            {status === STATES.ERROR && (
              <div style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius)",
                padding: "10px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "#f87171",
                marginBottom: "16px",
              }}>
                ⚠ {message}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={status === STATES.LOADING}
              style={{
                width: "100%",
                padding: "14px",
                background: status === STATES.LOADING ? "var(--surface-2)" : "var(--accent)",
                color: status === STATES.LOADING ? "var(--text-muted)" : "#000",
                border: "none",
                borderRadius: "var(--radius)",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                cursor: status === STATES.LOADING ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {status === STATES.LOADING ? (
                <>
                  <Spinner />
                  Analyzing with Llama 3...
                </>
              ) : (
                "Generate Briefing →"
              )}
            </button>
          </>
        )}
      </div>

      {/* Step hints */}
      {status !== STATES.SUCCESS && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          marginTop: "20px",
        }}>
          {[
            { step: "01", label: "Upload file" },
            { step: "02", label: "AI analysis" },
            { step: "03", label: "Email delivered" },
          ].map(({ step, label }) => (
            <div key={step} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--accent)",
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}>
                {step}
              </div>
              <div style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuccessState({ message, rowsAnalyzed, email, onReset }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: "64px", height: "64px",
        borderRadius: "50%",
        background: "rgba(16,185,129,0.1)",
        border: "2px solid var(--success)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
        fontSize: "28px",
      }}>
        ✓
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px", color: "var(--success)" }}>
        Briefing Sent!
      </h2>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)",
        lineHeight: 1.6, marginBottom: "8px",
      }}>
        {message}
      </p>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "24px",
      }}>
        {rowsAnalyzed} rows analyzed → {email}
      </p>
      <button
        onClick={onReset}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "10px 24px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-display)",
          fontSize: "13px",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
        onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-muted)"; }}
      >
        Analyze another file
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: "14px", height: "14px",
      border: "2px solid var(--border)",
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
