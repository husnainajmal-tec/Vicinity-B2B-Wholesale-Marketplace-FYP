import { Link } from "react-router-dom";
import Reveal from "../Reveal";
import { Check } from "../Icons";

const BUYER_POINTS = [
  "Browse verified sellers with confidence",
  "Compare tiered pricing by order quantity (MOQ)",
  "Negotiate directly with suppliers via live chat",
  "Track every order from placement to delivery",
];

const SELLER_POINTS = [
  "List products with volume-based tiered pricing",
  "Respond to buyer RFQs with structured quotes",
  "Negotiate and close deals in real time",
  "Manage orders and settlement in one dashboard",
];

function PointList({ points, tone }) {
  const checkCls = tone === "buyer" ? "text-accent" : "text-primary";
  return (
    <ul className="mt-6 space-y-3">
      {points.map((p) => (
        <li key={p} className="flex items-start gap-3">
          <span className={`mt-0.5 shrink-0 ${checkCls}`}>
            <Check size={18} strokeWidth={2.5} />
          </span>
          <span className="text-[15px] leading-relaxed tracking-[0.01em] text-text-primary">
            {p}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Two audience cards side by side. Buyers = amber accent; Sellers = navy
 * accent. Every bullet maps to a feature that exists in the app.
 */
export default function BuyerSellerSplit() {
  return (
    <section className="bg-background-alt py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* For Buyers */}
          <Reveal
            className="card-elevated card-hover relative overflow-hidden border-t-4 border-t-accent p-8"
          >
            {/* faint amber glow behind the header */}
            <div
              className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                For Buyers
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-text-primary">
                Source in Bulk, With Confidence
              </h3>
              <PointList points={BUYER_POINTS} tone="buyer" />
              <Link
                to="/marketplace"
                className="btn-press focus-ring mt-8 inline-flex items-center rounded-lg bg-accent px-5 py-2.5 font-semibold text-white"
              >
                Browse Products
              </Link>
            </div>
          </Reveal>

          {/* For Sellers */}
          <Reveal
            delay={120}
            className="card-elevated card-hover relative overflow-hidden border-t-4 border-t-primary p-8"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                For Sellers
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-text-primary">
                Reach Verified Bulk Buyers
              </h3>
              <PointList points={SELLER_POINTS} tone="seller" />
              <Link
                to="/register"
                className="btn-press focus-ring mt-8 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 font-semibold text-white"
              >
                Start Selling
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
