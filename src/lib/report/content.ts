/**
 * Editable narrative content for the final report.
 *
 * `REPORT_CHAPTERS` defines the fixed 10-chapter structure and sensible default
 * prose. Narrative chapters render this text as-is; data chapters render it as
 * an introduction ahead of the live figures and tables. `DEFAULT_RECOMMENDATIONS`
 * pre-fills chapter 9 with the project's sample recommendations, which the
 * operator can edit before exporting.
 */

import type { ReportChapter, ReportRecommendation } from "./types";

/** The ten report chapters, in order. */
export const REPORT_CHAPTERS: ReportChapter[] = [
  {
    id: 1,
    key: "introduction",
    title: "Introduction to Heat Waves",
    kind: "narrative",
    paragraphs: [
      "Heat waves are prolonged periods of abnormally high temperature that place severe stress on human health, livelihoods, agriculture, and critical infrastructure. In India, the pre-monsoon months of March to June routinely bring extreme heat across large parts of the country, with rising baseline temperatures and expanding urban heat islands intensifying both the frequency and the severity of these events.",
      "The India Meteorological Department (IMD) classifies heat-wave conditions using tiered severity levels. HeatGuard adopts a four-step, IMD-style scale — Normal, Yellow (watch), Orange (warning), and Red (emergency) — to communicate risk consistently to district administrators and disaster-management teams.",
      "This report consolidates HeatGuard's monitoring, recovery, and forward-looking analysis into a single decision-support document. It combines narrative context with live operational data drawn from the platform at the time of generation.",
    ],
  },
  {
    id: 2,
    key: "literature-review",
    title: "Literature Review",
    kind: "narrative",
    paragraphs: [
      "A growing body of research links rising heat exposure to excess mortality, reduced labour productivity, crop failure, and strain on power and water systems. Studies of Indian heat events consistently identify the elderly, young children, and those engaged in outdoor labour as the most susceptible groups, particularly where access to cooling and safe drinking water is limited.",
      "Heat Action Plans (HAPs), pioneered in Ahmedabad and since replicated across many Indian cities, demonstrate that early-warning systems paired with coordinated public-health responses can measurably reduce heat-related deaths. The literature emphasises early warning, targeted outreach to vulnerable populations, and inter-agency coordination as the core ingredients of an effective response.",
      "Remote sensing and machine learning increasingly complement ground observations, enabling the mapping of urban heat islands and short-range forecasting of health risk. HeatGuard's design draws on these findings, operationalising them as composite vulnerability indices, recovery indicators, and model-based risk prediction.",
    ],
  },
  {
    id: 3,
    key: "study-area",
    title: "Study Area Profile",
    kind: "data",
    paragraphs: [
      "HeatGuard v1 focuses on districts across six heat-exposed states. The profile below is generated from the platform's current region registry, summarising coverage by state, district type, and population.",
    ],
  },
  {
    id: 4,
    key: "methodology",
    title: "Research Methodology",
    kind: "narrative",
    paragraphs: [
      "HeatGuard ingests timestamped telemetry (air temperature and relative humidity) per district and derives a perceived-temperature heat index using the NOAA formulation. Each reading is classified against IMD-style thresholds to assign an alert level.",
      "A composite vulnerability index combines demographic and access factors — the share of elderly residents, young children, and outdoor workers, together with gaps in cooling and safe-water access — using transparent, fixed weights. Recovery is tracked through measurable post-event indicators: hospital admissions, workdays lost, crop losses, electricity failures, and water scarcity.",
      "Forward-looking risk is estimated by a separate prediction microservice trained on historical patterns, which the platform consumes as optional, clearly-labelled model estimates. All heat-index, alert, and vulnerability calculations are implemented as pure, unit-tested functions to ensure reproducibility.",
    ],
  },
  {
    id: 5,
    key: "response",
    title: "Heat Wave Response Analysis",
    kind: "data",
    paragraphs: [
      "This chapter analyses the current operational picture: the distribution of alert levels across monitored districts, the number of active early warnings, and the worst-affected regions by observed heat index.",
    ],
  },
  {
    id: 6,
    key: "recovery",
    title: "Recovery Measures",
    kind: "data",
    paragraphs: [
      "Recovery is assessed through the platform's post-event indicators, aggregated across monitored districts. These measures track the human, agricultural, and infrastructural toll of heat events and the pace of recuperation.",
    ],
  },
  {
    id: 7,
    key: "future-challenges",
    title: "Future Challenges",
    kind: "narrative",
    paragraphs: [
      "Climate projections indicate that heat waves will grow more frequent, more intense, and longer-lasting across the study region. Rapid, often unplanned, urbanisation amplifies the urban heat-island effect, while competing demands on water and electricity intensify during peak heat, compounding risk for the most vulnerable.",
      "Key challenges ahead include extending monitoring coverage to under-served rural and peri-urban districts, closing gaps in cooling and safe-water access, sustaining funding for district Heat Action Plans, and integrating heat resilience into long-term urban planning. Scenario analysis within HeatGuard is intended to help administrators stress-test these pressures before they materialise.",
    ],
  },
  {
    id: 8,
    key: "technology",
    title: "Role of Technology",
    kind: "narrative",
    paragraphs: [
      "Technology underpins every pillar of HeatGuard. GIS hotspot mapping and remote-sensing-style overlays localise risk to the district level, while AI-driven prediction provides short-range forecasts of heat and health risk that extend the window for preventive action.",
      "Real-time telemetry ingestion, automated alert classification, and shareable reporting reduce the latency between observation and response. Crucially, the system is designed to degrade gracefully: it runs fully offline on seeded data, with external services — including the prediction microservice — treated as optional enhancements rather than dependencies.",
    ],
  },
  {
    id: 9,
    key: "findings",
    title: "Findings and Recommendations",
    kind: "data",
    paragraphs: [
      "The findings below are derived directly from the live data in the preceding chapters. They are followed by prioritised recommendations, which the operator may edit prior to export.",
    ],
  },
  {
    id: 10,
    key: "conclusion",
    title: "Conclusion",
    kind: "narrative",
    paragraphs: [
      "Heat waves represent a growing and largely preventable threat to lives and livelihoods across India. The evidence assembled in this report reaffirms that timely early warning, targeted protection of vulnerable groups, and coordinated recovery are the decisive factors in reducing harm.",
      "HeatGuard demonstrates that these capabilities can be delivered on a single, resilient platform that turns raw telemetry into actionable decisions. Sustained investment in monitoring coverage, district Heat Action Plans, and the enabling technology described here will be essential to keeping communities safe as the climate continues to warm.",
    ],
  },
];

/** The project's sample recommendations, pre-filled into chapter 9. */
export const DEFAULT_RECOMMENDATIONS: ReportRecommendation[] = [
  {
    id: "urban-greenery",
    title: "Expand urban greenery and shade",
    detail:
      "Increase tree cover, green corridors, and shaded public spaces in high-density districts to reduce the urban heat-island effect and provide relief for outdoor workers and commuters.",
  },
  {
    id: "heat-action-plans",
    title: "Adopt and fund district Heat Action Plans",
    detail:
      "Establish and annually update Heat Action Plans in every monitored district, with clearly assigned responsibilities, activation thresholds tied to IMD-style alert levels, and dedicated funding.",
  },
  {
    id: "cool-roof",
    title: "Scale cool-roof technology",
    detail:
      "Promote reflective cool-roof coatings and heat-resistant building materials for homes, schools, and workplaces in the most exposed neighbourhoods, prioritising low-income housing.",
  },
  {
    id: "public-water",
    title: "Guarantee public drinking-water access",
    detail:
      "Deploy and maintain public drinking-water points and cooling shelters along high-footfall routes and in vulnerable settlements, with assured supply during peak-heat hours.",
  },
  {
    id: "ai-forecasting",
    title: "Invest in AI-driven forecasting",
    detail:
      "Sustain and extend the prediction microservice to deliver reliable short-range heat and health-risk forecasts, lengthening the lead time available for preventive action.",
  },
  {
    id: "awareness",
    title: "Target awareness for vulnerable groups",
    detail:
      "Run outreach campaigns focused on the elderly, young children, and outdoor workers, delivering practical guidance on hydration, timing of activity, and recognising heat illness.",
  },
  {
    id: "coordination",
    title: "Strengthen inter-departmental coordination",
    detail:
      "Formalise coordination between health, water, power, labour, and disaster-management departments so that alerts trigger pre-agreed, joined-up responses across agencies.",
  },
];
