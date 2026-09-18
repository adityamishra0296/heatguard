import type { ChangeEvent } from "react";

export interface MapToggle {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Accessible layer toggles (native checkboxes) for the map. */
export function MapControls({ toggles }: { toggles: MapToggle[] }) {
  return (
    <fieldset className="rounded-lg border border-border bg-background/90 p-3 shadow-md backdrop-blur">
      <legend className="px-1 text-xs font-semibold text-muted-foreground">
        Layers
      </legend>
      <div className="flex flex-col gap-1.5">
        {toggles.map((toggle) => (
          <label
            key={toggle.id}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              checked={toggle.checked}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                toggle.onChange(event.target.checked)
              }
              className="size-4 rounded border-input accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {toggle.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
