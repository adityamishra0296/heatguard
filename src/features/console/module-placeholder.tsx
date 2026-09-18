import type { LucideIcon } from "lucide-react";

import { DataEmptyState } from "@/components/data-empty-state";
import { SectionHeader } from "@/components/section-header";

/** Shell page for console modules not yet implemented. Keeps the nav complete
 *  and navigable while a module is pending. */
export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <SectionHeader as="h1" title={title} description={description} />
      <DataEmptyState
        className="mt-8"
        icon={<Icon className="size-8" />}
        title="Coming soon"
        description="This module is planned for an upcoming milestone."
      />
    </div>
  );
}
