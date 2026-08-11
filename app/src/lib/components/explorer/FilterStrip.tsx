import type { ReactNode } from "react";
import type { ChipColor } from "./SearchBar";

interface Segment<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  colors: ChipColor;
}

interface FilterStripProps<T extends string> {
  rows: Segment<T>[][];
  activeValues: Set<T>;
  onToggle: (value: T) => void;
}

export function FilterStrip<T extends string>({
  rows,
  activeValues,
  onToggle,
}: FilterStripProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((seg) => {
            const active = activeValues.has(seg.value);
            return (
              <button
                key={seg.value}
                aria-pressed={active}
                onClick={() => onToggle(seg.value)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-xs font-medium transition-colors ${active ? seg.colors.active : seg.colors.inactive}`}
              >
                {seg.icon}
                <span className="truncate">{seg.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
