import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Custom404() {
  const sparklesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createSparkle = () => {
      if (!sparklesRef.current) return;

      const sparkle = document.createElement("div");
      const size = Math.random() * 6 + 4;
      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkle.style.background = "gold";
      sparkle.style.borderRadius = "50%";
      sparkle.style.position = "absolute";
      sparkle.style.top = `${Math.random() * 100}%`;
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.opacity = "0";
      sparkle.style.transform = "scale(0)";
      sparkle.style.pointerEvents = "none";
      sparkle.style.transition = "all 0.5s ease-out";

      sparklesRef.current.appendChild(sparkle);

      // Animate in
      requestAnimationFrame(() => {
        sparkle.style.opacity = "1";
        sparkle.style.transform = "scale(1)";
      });

      // Float upwards and fade out
      const floatDuration = 3000 + Math.random() * 2000;
      sparkle.animate([
        { transform: `translateY(0px) scale(1)`, opacity: 1 },
        { transform: `translateY(-50px) scale(0.5)`, opacity: 0 }
      ], {
        duration: floatDuration,
        easing: "ease-out",
        fill: "forwards"
      });

      setTimeout(() => {
        sparkle.remove();
      }, floatDuration);
    };

    const interval = setInterval(createSparkle, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#FDF6F0",
        color: "#4B2E2E",
        fontFamily: "'Helvetica Neue', sans-serif",
        padding: "0 1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={sparklesRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      />
      <h1 style={{
        fontSize: "8rem",
        fontWeight: "bold",
        margin: 0,
        color: "#8B5E3C",
        textShadow: "2px 2px 5px rgba(0,0,0,0.2)",
        position: "relative",
        zIndex: 1,
      }}>
        404
      </h1>
      <h2 style={{
        margin: "1rem 0",
        fontSize: "2rem",
        fontWeight: "500",
        position: "relative",
        zIndex: 1,
      }}>
        Oops! Page not found
      </h2>
      <p style={{
        fontSize: "1.2rem",
        maxWidth: "400px",
        position: "relative",
        zIndex: 1,
      }}>
        The page you are looking for doesn’t exist. But don’t worry—you can always return home.
      </p>
      <Link href="/" style={{
        marginTop: "1.5rem",
        padding: "0.75rem 2rem",
        backgroundColor: "#8B5E3C",
        color: "#FFF",
        fontWeight: "600",
        borderRadius: "8px",
        textDecoration: "none",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        transition: "all 0.3s ease",
        position: "relative",
        zIndex: 1,
        display: "inline-block",
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#A3714D";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#8B5E3C";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      }}
      >
        Go Home
      </Link>
    </div>
  );
}