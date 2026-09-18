import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";

import { ModulePlaceholder } from "@/features/console/module-placeholder";

export const metadata: Metadata = { title: "Recovery" };

export default function RecoveryPage() {
  return (
    <ModulePlaceholder
      title="Recovery Indicators"
      description="Hospital admissions, workdays lost, crop losses, electricity failures, and water scarcity over time."
      icon={HeartPulse}
    />
  );
}
