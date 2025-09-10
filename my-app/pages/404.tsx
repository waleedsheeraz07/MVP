import Link from "next/link";

export default function Custom404() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      textAlign: "center",
      backgroundColor: "#f5f5f5",
      color: "#333"
    }}>
      <h1 style={{ fontSize: "6rem", margin: 0 }}>404</h1>
      <h2 style={{ margin: "1rem 0" }}>Oops! Page not found.</h2>
      <p>The page you are looking for does not exist.</p>
      <Link href="/" style={{
        marginTop: "1rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#8B5E3C",
        color: "#fff",
        borderRadius: "5px",
        textDecoration: "none"
      }}>
        Go Home
      </Link>
    </div>
  );
}