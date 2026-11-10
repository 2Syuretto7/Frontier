import Link from "next/link";
import { AuthFrame } from "@/components/AuthFrame";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <AuthFrame>
      <div className="card">
        <p className="eyebrow"><span className="mono-meta">404</span></p>
        <h1>This page is not on the map</h1>
        <p className="lede">The link may be old, or the lesson may not be written yet.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">Go home</Link>
          <Link href="/map" className="btn">Open the map</Link>
        </div>
      </div>
    </AuthFrame>
  );
}
