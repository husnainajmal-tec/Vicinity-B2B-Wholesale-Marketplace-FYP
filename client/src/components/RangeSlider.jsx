/**
 * Simple, reliable dual-bound range control: a "min" slider and a "max"
 * slider that clamp against each other. Avoids fragile overlapping-thumb
 * hacks while still giving a slider UX for both bounds.
 *
 * Props:
 *   label            section label
 *   min, max, step   slider bounds
 *   valueMin/valueMax current values
 *   onChange({min,max})
 *   format(v)        optional value formatter for the display
 */
export default function RangeSlider({
  label,
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  format = (v) => v,
}) {
  const lo = valueMin ?? min;
  const hi = valueMax ?? max;
  const disabled = max <= min;

  const handleMin = (e) => {
    const next = Math.min(Number(e.target.value), hi);
    onChange({ min: next, max: hi });
  };
  const handleMax = (e) => {
    const next = Math.max(Number(e.target.value), lo);
    onChange({ min: lo, max: next });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="num text-xs text-text-secondary">
          {format(lo)} – {format(hi)}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <span className="mb-1 block text-xs text-text-secondary">Min</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={lo}
            onChange={handleMin}
            disabled={disabled}
            className="w-full accent-accent"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs text-text-secondary">Max</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={hi}
            onChange={handleMax}
            disabled={disabled}
            className="w-full accent-accent"
          />
        </div>
      </div>
    </div>
  );
}
