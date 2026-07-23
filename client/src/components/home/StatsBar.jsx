import Reveal from "../Reveal";

// TODO: replace with real aggregation counts before defense
// (verified sellers, active products, cumulative trade volume, distinct categories).
const STATS = [
  { value: "150+", label: "Verified Sellers" },
  { value: "2,400+", label: "Products Listed" },
  { value: "PKR 12M+", label: "in Trade Volume" },
  { value: "18", label: "Categories" },
];

/**
 * Thin trust/stats strip directly under the hero. Faint navy-tinted
 * gradient for depth. Numbers in mono, labels in body — understated.
 */
export default function StatsBar() {
  return (
    <section className="border-y border-white/10 bg-gradient-to-r from-[#15263f] via-primary to-[#15263f] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-6 py-7 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 70}
            className="flex flex-col items-center text-center md:border-r md:border-white/10 md:last:border-r-0"
          >
            <span className="num text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {stat.value}
            </span>
            <span className="mt-1 text-xs font-medium text-white/60 md:text-sm">
              {stat.label}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
