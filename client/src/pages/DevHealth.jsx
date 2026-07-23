import { useEffect, useState } from "react";
import api from "../services/api";

/**
 * Developer diagnostics — relocated off the public homepage.
 * Backend/DB connection check + the Trade Navy palette reference.
 * Reachable at /dev/health for local debugging.
 */
export default function DevHealth() {
  const [health, setHealth] = useState({ state: "checking", data: null });

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setHealth({ state: "ok", data: res.data.data }))
      .catch(() => setHealth({ state: "error", data: null }));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Diagnostics
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-text-primary">
        Developer health check
      </h1>
      <p className="mt-2 text-text-secondary">
        Local debugging view. Not linked from the public site.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-background-alt p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">
              Backend connection
            </h2>
            <HealthPill state={health.state} />
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            {health.state === "ok" &&
              `API responded. Database: ${health.data?.db}.`}
            {health.state === "checking" && "Pinging /api/health…"}
            {health.state === "error" &&
              "Could not reach the API. Start the server and check VITE_API_URL."}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-background-alt p-5">
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">
            Trade Navy palette
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Swatch className="bg-primary text-white" label="primary" />
            <Swatch className="bg-primary-hover text-white" label="hover" />
            <Swatch className="bg-accent text-white" label="accent" />
            <Swatch className="bg-success text-white" label="success" />
            <Swatch className="bg-danger text-white" label="danger" />
            <Swatch
              className="border border-border bg-background text-text-secondary"
              label="bg-alt"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function HealthPill({ state }) {
  const styles = {
    ok: "bg-success/10 text-success",
    checking: "bg-accent/10 text-accent",
    error: "bg-danger/10 text-danger",
  };
  const labels = { ok: "Connected", checking: "Checking…", error: "Offline" };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[state]}`}>
      {labels[state]}
    </span>
  );
}

function Swatch({ className, label }) {
  return (
    <div className={`flex h-12 items-end rounded-lg p-1.5 text-[10px] font-medium ${className}`}>
      {label}
    </div>
  );
}
