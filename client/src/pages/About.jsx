import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";

/**
 * About Us — Final Year Project overview for Vicinity Trade.
 */
export default function About() {
  const team = [
    {
      name: "Abdul Raqeeb Khan",
      reg: "4624-FOC/BSCS/F22",
      role: "Student Developer",
    },
    {
      name: "Husnain Ajmal",
      reg: "4619-FOC/BSCS/F22",
      role: "Student Developer",
    },
  ];

  return (
    <main className="bg-background">
      {/* Header band */}
      <section className="border-b border-border bg-gradient-to-br from-primary via-[#1a3554] to-[#15263f] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            About Vicinity Trade
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight md:text-5xl">
            Built for bulk trade — from RFQ to delivery.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            A Final Year Project connecting manufacturers and wholesalers with
            retailers and bulk buyers on one B2B wholesale marketplace.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Project idea */}
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            The Idea
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary">
            Why Vicinity Trade?
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-[15px] leading-relaxed tracking-[0.01em] text-text-secondary">
            <p>
              Wholesale trade in Pakistan still often relies on phone calls,
              WhatsApp threads, and informal trust. Buyers struggle to compare
              verified suppliers side by side; sellers lack a structured way to
              quote, negotiate, and track settlement. Vicinity Trade closes that
              gap with a dedicated B2B platform.
            </p>
            <p>
              The platform lets buyers post RFQs, browse products with
              MOQ-based tiered pricing, and chat with sellers in real time.
              Sellers list inventory, respond with structured quotes, manage
              orders, and track settlement — all in one dashboard. An
              admin-reviewed verification badge helps buyers trust who they are
              dealing with.
            </p>
            <p>
              The goal is a modern, end-to-end wholesale workflow: discover →
              negotiate → order → deliver, without leaving the app.
            </p>
          </div>
        </Reveal>

        {/* Academic credit */}
        <Reveal className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Academic Credit
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary">
            Final Year Project
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed tracking-[0.01em] text-text-secondary">
            Vicinity Trade is developed as a Final Year Project by{" "}
            <span className="font-medium text-text-primary">
              Abdul Raqeeb Khan
            </span>{" "}
            (Registration No.{" "}
            <span className="num text-text-primary">4624-FOC/BSCS/F22</span>) and{" "}
            <span className="font-medium text-text-primary">Husnain Ajmal</span>{" "}
            (Registration No.{" "}
            <span className="num text-text-primary">4619-FOC/BSCS/F22</span>),
            under the supervision of{" "}
            <span className="font-medium text-text-primary">
              Sir Ahsen Tanveer
            </span>
            .
          </p>
        </Reveal>

        {/* Team cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <Reveal key={member.reg} delay={i * 80}>
              <div className="card-elevated h-full p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-display text-lg font-semibold text-primary">
                  {member.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  {member.role}
                </p>
                <p className="num mt-3 text-sm text-text-secondary">
                  {member.reg}
                </p>
              </div>
            </Reveal>
          ))}

          <Reveal delay={160}>
            <div className="card-elevated h-full border-t-4 border-t-accent p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Supervisor
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">
                Sir Ahsen Tanveer
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Project supervisor guiding the design, implementation, and
                evaluation of Vicinity Trade as an academic Final Year Project.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Scope note */}
        <Reveal className="mt-16 rounded-xl border border-border bg-background-alt p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Project Scope
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed tracking-[0.01em] text-text-secondary">
            Vicinity Trade demonstrates authentication & roles, company
            verification, product management with volume pricing, search &
            discovery, RFQs and quotes, real-time chat, order lifecycle,
            notifications, reviews, favorites, an admin panel, and simulated
            COD settlement tracking. Real payment gateway integration is
            intentionally scoped as future work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/marketplace"
              className="btn-press focus-ring rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse Products
            </Link>
            <Link
              to="/contact"
              className="btn-press focus-ring rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-text-primary"
            >
              Contact Us
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
