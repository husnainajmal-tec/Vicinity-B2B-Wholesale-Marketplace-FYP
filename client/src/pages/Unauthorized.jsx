import { Link } from "react-router-dom";

/** Shown when a logged-in user lacks the required role for a route. */
export default function Unauthorized() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold text-text-primary">403</h1>
      <p className="mt-2 text-text-secondary">
        You don't have permission to access this page.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
