import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import StatsBar from "../components/home/StatsBar";
import HowItWorks from "../components/home/HowItWorks";
import BuyerSellerSplit from "../components/home/BuyerSellerSplit";
import CategoryGrid from "../components/home/CategoryGrid";
import VerifiedSellers from "../components/home/VerifiedSellers";

/** Served from client/public/videos/hero.mp4 → /videos/hero.mp4 */
const HERO_VIDEO = "/videos/hero.mp4";

/**
 * Public landing page — full-bleed video hero (unchanged) followed by the
 * marketing sections. Developer diagnostics now live at /dev/health.
 */
export default function Home() {
  const [videoReady, setVideoReady] = useState(false);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const primaryCta =
    !token
      ? { to: "/register", label: "Post an RFQ" }
      : user?.role === "buyer"
        ? { to: "/rfqs/new", label: "Post an RFQ" }
        : user?.role === "seller"
          ? { to: "/rfqs", label: "Browse RFQs" }
          : { to: "/dashboard", label: "Go to Dashboard" };

  return (
    <main>
      {/* ---------- Full-bleed video hero (do not change) ---------- */}
      <section className="relative isolate flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-primary">
        {/* Video layer */}
        <div className="absolute inset-0 -z-10">
          <video
            className={`h-full w-full object-cover transition-opacity duration-1000 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          {/* Navy wash — keeps type legible over any footage */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(15,27,46,0.92) 0%, rgba(27,58,92,0.78) 42%, rgba(27,58,92,0.45) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/30" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
          <p
            className="hero-reveal mb-4 flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
            style={{ animationDelay: "0ms" }}
          >
            <img
              src="/logo.png"
              alt=""
              className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14"
              width={56}
              height={56}
            />
            Vicinity Trade
          </p>
          <p
            className="hero-reveal mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent"
            style={{ animationDelay: "120ms" }}
          >
            B2B Wholesale Marketplace
          </p>
          <h1
            className="hero-reveal max-w-2xl font-display font-semibold leading-[1.08] text-white"
            style={{
              fontSize: "clamp(36px, 5.5vw, 58px)",
              animationDelay: "220ms",
            }}
          >
            Source in bulk, negotiate in real time.
          </h1>
          <p
            className="hero-reveal mt-5 max-w-lg text-lg leading-relaxed text-white/80"
            style={{ animationDelay: "340ms" }}
          >
            Connect manufacturers and wholesalers with retailers and bulk
            buyers — from RFQ to delivery, in one place.
          </p>

          <div
            className="hero-reveal mt-9 flex flex-wrap gap-3"
            style={{ animationDelay: "460ms" }}
          >
            <Link
              to={primaryCta.to}
              className="rounded-md bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
            >
              {primaryCta.label}
            </Link>
            <Link
              to="/marketplace"
              className="rounded-md border border-white/35 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Browse Products
            </Link>
          </div>
        </div>

        {/* Soft scroll cue */}
        <div
          className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-white/50 sm:block"
          aria-hidden
        >
          <span className="hero-scroll-cue block h-8 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </section>

      {/* ---------- Below the hero ---------- */}
      <StatsBar />
      <HowItWorks />
      <BuyerSellerSplit />
      <CategoryGrid />
      <VerifiedSellers />

      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-scroll {
          0%, 100% { opacity: 0.35; transform: scaleY(0.7); }
          50% { opacity: 0.85; transform: scaleY(1); }
        }
        .hero-reveal {
          opacity: 0;
          animation: hero-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .hero-scroll-cue {
          transform-origin: top;
          animation: hero-scroll 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-reveal { opacity: 1; animation: none; }
          .hero-scroll-cue { animation: none; }
        }
      `}</style>
    </main>
  );
}
