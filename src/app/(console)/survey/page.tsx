import type { Metadata } from "next";

import { SectionHeader } from "@/components/section-header";
import { SurveyModule } from "@/features/survey/survey-module";
import { getRegionsList } from "@/server/regions";
import { getSurveys } from "@/server/surveys";

export const metadata: Metadata = { title: "Field Survey" };

export const dynamic = "force-dynamic";

export default async function SurveyPage() {
  const [regions, responses] = await Promise.all([
    getRegionsList(),
    getSurveys(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <SectionHeader
        as="h1"
        title="Field Survey"
        description="Capture heat-awareness and access data from the field, then review aggregates and export the results."
      />
      <div className="mt-6">
        <SurveyModule regions={regions} initialResponses={responses} />
      </div>
    </div>
  );
}
