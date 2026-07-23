import useReveal from "../hooks/useReveal";

/**
 * Wraps children in a scroll-reveal container: fades + lifts into place
 * as it enters the viewport. `delay` (ms) staggers grouped items.
 * Motion is disabled automatically for prefers-reduced-motion (see .reveal
 * rules in index.css).
 */
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
