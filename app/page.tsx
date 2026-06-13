import Link from "next/link";

export default function WelcomePage() {
  return (
    <div style={{
      minHeight: "calc(100vh - 65px)",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        {/* Logo mark */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "#16a34a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 32px",
          boxShadow: "0 4px 20px rgba(22,163,74,0.25)",
        }}>
          <span style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>HL</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 38,
          fontWeight: 800,
          color: "#111827",
          lineHeight: 1.15,
          margin: "0 0 16px",
          letterSpacing: -0.5,
        }}>
          Welcome to HealthLedger
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 16,
          color: "#6b7280",
          lineHeight: 1.6,
          margin: "0 0 40px",
          maxWidth: 360,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          See what any medical test actually costs{" "}
          <span style={{ color: "#111827", fontWeight: 600 }}>you</span>
          {" "}— not the sticker price — based on your real insurance deductible.
        </p>

        {/* CTA */}
        <Link
          href="/profile"
          style={{
            display: "inline-block",
            background: "#16a34a",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            padding: "14px 44px",
            borderRadius: 50,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
            transition: "background 0.15s, transform 0.1s",
          }}
        >
          Get Started →
        </Link>

        {/* Reassurance note */}
        <p style={{ marginTop: 20, fontSize: 13, color: "#9ca3af" }}>
          No sign-up required · data stays on your device
        </p>
      </div>
    </div>
  );
}
