import { Link } from "react-router-dom";

/** 404 fallback route. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold text-text-primary">404</h1>
      <p className="mt-2 text-text-secondary">
        We couldn't find the page you were looking for.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
      >
        Back home
      </Link>
    </div>
  );
}
