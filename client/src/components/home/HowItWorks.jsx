import Reveal from "../Reveal";
import { FileText, MessagesSquare, PackageCheck, ArrowRight } from "../Icons";

const STEPS = [
  {
    icon: FileText,
    title: "Post an RFQ",
    desc: "Buyers describe what they need and how much.",
  },
  {
    icon: MessagesSquare,
    title: "Compare Verified Quotes",
    desc: "Sellers respond, and buyers compare pricing side by side.",
  },
  {
    icon: PackageCheck,
    title: "Negotiate & Order",
    desc: "Chat live, agree on terms, and the order is created automatically.",
  },
];

/**
 * Three-step process with a connecting line on desktop; stacks on mobile.
 */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Process
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-text-primary md:text-4xl">
            How Vicinity Trade Works
          </h2>
          <p className="mt-3 leading-relaxed tracking-[0.01em] text-text-secondary">
            From first request to fulfilled order, the whole flow lives in one
            place.
          </p>
        </Reveal>

        <div className="relative mt-14">
          {/* Connector line (desktop only), behind the step nodes */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-8 hidden md:block"
            aria-hidden="true"
          >
            <div className="mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal
                  key={step.title}
                  delay={i * 120}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-sm">
                    <Icon size={26} />
                    <span className="num absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs leading-relaxed tracking-[0.01em] text-text-secondary">
                    {step.desc}
                  </p>

                  {/* Arrow between steps (desktop) */}
                  {i < STEPS.length - 1 && (
                    <ArrowRight
                      size={22}
                      className="absolute -right-3 top-6 hidden text-border md:block"
                    />
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
