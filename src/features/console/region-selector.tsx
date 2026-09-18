"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface RegionListItem {
  id: string;
  name: string;
  state: string;
}

/** Native-select region jump menu, grouped by state. Navigates to the region's
 *  detail page on selection. A native `<select>` is fully keyboard-accessible. */
export function RegionSelector({ regions }: { regions: RegionListItem[] }) {
  const router = useRouter();

  const groups = new Map<string, RegionListItem[]>();
  for (const region of regions) {
    const list = groups.get(region.state) ?? [];
    list.push(region);
    groups.set(region.state, list);
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    if (id) {
      router.push(`/regions/${id}`);
    }
  }

  return (
    <>
      <label htmlFor="region-selector" className="sr-only">
        Jump to region
      </label>
      <select
        id="region-selector"
        defaultValue=""
        onChange={handleChange}
        className="h-9 w-32 shrink rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
      >
        <option value="" disabled>
          Jump to region…
        </option>
        {[...groups.entries()].map(([state, items]) => (
          <optgroup key={state} label={state}>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </>
  );
}
