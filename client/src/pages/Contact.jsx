import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { toast } from "../store/toastStore";

/**
 * Contact Us — enquiry form (client-side confirmation toast on submit).
 */
export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Thanks — your message has been noted.");
    }, 600);
  };

  return (
    <main className="bg-background">
      <section className="border-b border-border bg-gradient-to-br from-primary via-[#1a3554] to-[#15263f] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Contact
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">
            Get in touch
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
            Questions about the project or feedback — we&apos;d like to hear
            from you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="space-y-5">
              <InfoCard
                title="Project team"
                body="Abdul Raqeeb Khan & Husnain Ajmal — BSCS Final Year Project."
              />
              <InfoCard
                title="Supervision"
                body="Under the guidance of Sir Ahsen Tanveer."
              />
              <p className="text-sm text-text-secondary">
                Prefer browsing first?{" "}
                <Link
                  to="/about"
                  className="font-semibold text-accent hover:underline"
                >
                  Read About Us
                </Link>{" "}
                or{" "}
                <Link
                  to="/marketplace"
                  className="font-semibold text-accent hover:underline"
                >
                  explore the marketplace
                </Link>
                .
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <form
              onSubmit={handleSubmit}
              className="card-elevated space-y-4 p-6 md:p-8"
            >
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Send a message
              </h2>

              <Field
                label="Full name"
                value={form.name}
                onChange={update("name")}
                placeholder="Your name"
                required
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                required
              />
              <Field
                label="Subject"
                value={form.subject}
                onChange={update("subject")}
                placeholder="e.g. Feedback, question"
                required
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-primary">
                  Message
                </span>
                <textarea
                  value={form.message}
                  onChange={update("message")}
                  rows={5}
                  required
                  placeholder="How can we help?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <button
                type="submit"
                disabled={sending}
                className="btn-press focus-ring w-full rounded-lg bg-accent px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ title, body }) {
  return (
    <div className="card-elevated p-5">
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{body}</p>
    </div>
  );
}

function Field({ label, type = "text", ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </span>
      <input
        type={type}
        {...props}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
