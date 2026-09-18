/**
 * The printable report document — a standalone, print-optimized rendering of the
 * full 10-chapter report used both for on-screen "print view" and as the source
 * that the server-side PDF generator captures. All colours are explicit (light,
 * professional) so output is identical regardless of the viewer's theme, and
 * figures are inline SVG so they survive print/PDF without client JavaScript.
 */

import type { HeatAlertLevel } from "@/lib/enums";
import { formatDateTimeUTC, formatDateUTC, formatNumber } from "@/lib/format";
import { BarChartSVG, LEVEL_COLORS, RegionMapSVG } from "@/lib/report/figures";
import type {
  ReportChapter,
  ReportModel,
  ReportOptions,
} from "@/lib/report/types";

const LEVEL_LABEL: Record<HeatAlertLevel, string> = {
  NORMAL: "Normal",
  YELLOW: "Yellow",
  ORANGE: "Orange",
  RED: "Red",
};

function LevelChip({ level }: { level: HeatAlertLevel }) {
  return (
    <span className="chip" style={{ background: LEVEL_COLORS[level] }}>
      {LEVEL_LABEL[level]}
    </span>
  );
}

function Figure({
  n,
  caption,
  children,
}: {
  n: number;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure>
      {children}
      <figcaption>
        Figure {n}. {caption}
      </figcaption>
    </figure>
  );
}

/** Build the plain-language findings from the live model. */
function buildFindings(model: ReportModel): string[] {
  const findings: string[] = [];
  const { response, recovery, vulnerability, prediction, studyArea } = model;

  const elevated = response.levelCounts
    .filter((l) => l.level === "ORANGE" || l.level === "RED")
    .reduce((sum, l) => sum + l.count, 0);
  findings.push(
    `${elevated} of ${studyArea.regionCount} monitored districts are currently at Orange or Red alert, with ${response.activeAlertCount} active early warning${response.activeAlertCount === 1 ? "" : "s"}.`,
  );

  const worst = response.worstHit[0];
  if (worst) {
    findings.push(
      `The worst-affected district is ${worst.name} (${worst.state}) at a heat index of ${worst.heatIndexC}°C (${LEVEL_LABEL[worst.level]}).`,
    );
  }

  if (recovery.available) {
    findings.push(
      `Recovery indicators record ${formatNumber(recovery.totals.hospitalAdmissions)} heat-related hospital admissions and ${formatNumber(recovery.totals.workdaysLost)} workdays lost across monitored districts, with average crop loss of ${recovery.totals.avgCropLossPct}%.`,
    );
  }

  if (vulnerability.available && vulnerability.top[0]) {
    const top = vulnerability.top[0];
    findings.push(
      `${top.name} (${top.state}) carries the highest composite vulnerability score at ${top.score} (${top.band} band); ${vulnerability.atRisk.length} district${vulnerability.atRisk.length === 1 ? " is" : "s are"} flagged in the at-risk intersection.`,
    );
  }

  if (prediction.available && prediction.top[0]) {
    const p = prediction.top[0];
    findings.push(
      `Model forecasts indicate ${p.name} (${p.state}) will see the highest predicted peak heat index (${p.peakHeatIndexC}°C) over the coming week.`,
    );
  } else {
    findings.push(
      "Model-based forecasts were unavailable at generation time; predictive findings are omitted and should be reviewed once the prediction service is online.",
    );
  }

  return findings;
}

function defaultExecSummary(model: ReportModel): string {
  const { studyArea, response, vulnerability } = model;
  const asOf = model.meta.dataAsOf
    ? formatDateUTC(model.meta.dataAsOf)
    : "the latest available data";
  return (
    `As of ${asOf}, HeatGuard monitors ${studyArea.regionCount} districts across ${studyArea.stateCount} states, covering a combined population of ${formatNumber(studyArea.totalPopulation)}. ` +
    `${response.activeAlertCount} early warning${response.activeAlertCount === 1 ? " is" : "s are"} currently active, and ${vulnerability.atRisk.length} district${vulnerability.atRisk.length === 1 ? "" : "s"} fall within the high-risk intersection of heat and vulnerability. ` +
    `This report combines that live operational picture with narrative analysis and prioritised recommendations for decision-makers.`
  );
}

function DataChapterBody({
  chapter,
  model,
  options,
}: {
  chapter: ReportChapter;
  model: ReportModel;
  options: ReportOptions;
}) {
  if (chapter.key === "study-area") {
    const { studyArea } = model;
    return (
      <>
        <table>
          <thead>
            <tr>
              <th>State</th>
              <th>Districts</th>
              <th>Population</th>
            </tr>
          </thead>
          <tbody>
            {studyArea.states.map((s) => (
              <tr key={s.state}>
                <td>{s.state}</td>
                <td>{s.regionCount}</td>
                <td>{formatNumber(s.population)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total</td>
              <td>{studyArea.regionCount}</td>
              <td>{formatNumber(studyArea.totalPopulation)}</td>
            </tr>
          </tbody>
        </table>
        <p className="note">
          District mix:{" "}
          {studyArea.districtTypes.map((d, i) => (
            <span key={d.type}>
              {i > 0 ? ", " : ""}
              {d.count} {d.type}
            </span>
          ))}
          .
        </p>
        {studyArea.regions.length > 0 ? (
          <Figure
            n={1}
            caption="Monitored districts by location, sized by population and coloured by current alert level."
          >
            <RegionMapSVG
              regions={studyArea.regions}
              colorBy="level"
              ariaLabel="Map of monitored districts by alert level"
            />
          </Figure>
        ) : (
          <p className="empty">No region data available.</p>
        )}
      </>
    );
  }

  if (chapter.key === "response") {
    const { response } = model;
    const levelData = response.levelCounts.map((l) => ({
      label: LEVEL_LABEL[l.level],
      value: l.count,
      color: LEVEL_COLORS[l.level],
    }));
    return (
      <>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-value">{response.activeAlertCount}</span>
            <span className="stat-label">Active warnings</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {response.avgHeatIndexC ?? "—"}
              {response.avgHeatIndexC !== null ? "°C" : ""}
            </span>
            <span className="stat-label">Avg. heat index</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {response.statusCode?.code ?? "—"}
            </span>
            <span className="stat-label">
              System status ({response.statusCode?.overall ?? "n/a"})
            </span>
          </div>
        </div>
        <Figure
          n={2}
          caption="Distribution of monitored districts across IMD-style alert levels."
        >
          <BarChartSVG data={levelData} ariaLabel="Alert-level distribution" />
        </Figure>
        {response.worstHit.length > 0 ? (
          <>
            <Figure
              n={3}
              caption="Worst-affected districts by current heat index (°C)."
            >
              <BarChartSVG
                data={response.worstHit.map((r) => ({
                  label: `${r.name}`,
                  value: r.heatIndexC,
                  color: LEVEL_COLORS[r.level],
                }))}
                ariaLabel="Worst-affected districts by heat index"
                format={(v) => `${v}°C`}
              />
            </Figure>
            <table>
              <thead>
                <tr>
                  <th>District</th>
                  <th>State</th>
                  <th>Heat index</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {response.worstHit.map((r) => (
                  <tr key={`${r.name}-${r.state}`}>
                    <td>{r.name}</td>
                    <td>{r.state}</td>
                    <td>{r.heatIndexC}°C</td>
                    <td>
                      <LevelChip level={r.level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="empty">
            No current readings available to rank affected districts.
          </p>
        )}
      </>
    );
  }

  if (chapter.key === "recovery") {
    const { recovery } = model;
    if (!recovery.available) {
      return (
        <p className="empty">
          Recovery indicator data is not available for this report.
        </p>
      );
    }
    return (
      <>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-value">
              {formatNumber(recovery.totals.hospitalAdmissions)}
            </span>
            <span className="stat-label">Hospital admissions</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {formatNumber(recovery.totals.workdaysLost)}
            </span>
            <span className="stat-label">Workdays lost</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {recovery.totals.avgCropLossPct}%
            </span>
            <span className="stat-label">Avg. crop loss</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {formatNumber(recovery.totals.electricityFailures)}
            </span>
            <span className="stat-label">Electricity failures</span>
          </div>
        </div>
        <Figure
          n={4}
          caption="Districts with the highest cumulative heat-related hospital admissions."
        >
          <BarChartSVG
            data={recovery.worstByAdmissions.map((r) => ({
              label: r.name,
              value: r.hospitalAdmissions,
              color: "#dc2626",
            }))}
            ariaLabel="Hospital admissions by district"
          />
        </Figure>
        {recovery.series.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hospital admissions</th>
                <th>Workdays lost</th>
              </tr>
            </thead>
            <tbody>
              {recovery.series.map((p) => (
                <tr key={p.date}>
                  <td>{formatDateUTC(p.date)}</td>
                  <td>{formatNumber(p.hospitalAdmissions)}</td>
                  <td>{formatNumber(p.workdaysLost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </>
    );
  }

  // findings
  const findings = buildFindings(model);
  const { vulnerability, prediction } = model;
  return (
    <>
      <h3>Key findings</h3>
      <ol className="findings">
        {findings.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ol>

      {vulnerability.available && vulnerability.top.length > 0 ? (
        <>
          <Figure
            n={5}
            caption="Districts ranked by composite vulnerability score (0–100)."
          >
            <BarChartSVG
              data={vulnerability.top.map((r) => ({
                label: r.name,
                value: r.score,
                color: "#7c5cbf",
              }))}
              ariaLabel="Vulnerability score by district"
            />
          </Figure>
          {vulnerability.atRisk.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>District</th>
                  <th>State</th>
                  <th>Vulnerability</th>
                  <th>Current</th>
                  <th>Predicted</th>
                </tr>
              </thead>
              <tbody>
                {vulnerability.atRisk.map((r) => (
                  <tr key={`${r.name}-${r.state}`}>
                    <td>{r.name}</td>
                    <td>{r.state}</td>
                    <td>{r.score}</td>
                    <td>
                      <LevelChip level={r.currentLevel} />
                    </td>
                    <td>
                      {r.predictedLevel ? (
                        <LevelChip level={r.predictedLevel} />
                      ) : (
                        <span className="muted">n/a</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </>
      ) : null}

      {prediction.available && prediction.top.length > 0 ? (
        <>
          <h3>Predicted peak risk (next 7 days)</h3>
          <table>
            <thead>
              <tr>
                <th>District</th>
                <th>State</th>
                <th>Peak heat index</th>
                <th>Peak level</th>
                <th>Days elevated</th>
              </tr>
            </thead>
            <tbody>
              {prediction.top.map((r) => (
                <tr key={`${r.name}-${r.state}`}>
                  <td>{r.name}</td>
                  <td>{r.state}</td>
                  <td>{r.peakHeatIndexC}°C</td>
                  <td>
                    <LevelChip level={r.peakLevel} />
                  </td>
                  <td>{r.daysElevated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <h3>Recommendations</h3>
      {options.recommendations.length === 0 ? (
        <p className="empty">No recommendations were provided.</p>
      ) : (
        <ol className="recommendations">
          {options.recommendations.map((rec) => (
            <li key={rec.id}>
              <strong>{rec.title}.</strong> {rec.detail}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export function ReportDocument({
  model,
  options,
  chapters,
}: {
  model: ReportModel;
  options: ReportOptions;
  chapters: ReportChapter[];
}) {
  const execSummary = options.execSummary?.trim() || defaultExecSummary(model);

  return (
    <div className="report">
      <style>{REPORT_CSS}</style>

      {/* Cover */}
      <section className="cover">
        <div className="cover-kicker">
          HeatGuard · Heat Wave Early Warning System
        </div>
        <h1 className="cover-title">{model.meta.title}</h1>
        <p className="cover-subtitle">{model.meta.subtitle}</p>
        <div className="cover-meta">
          <div>
            <span>Prepared by</span>
            <strong>{model.meta.organisation}</strong>
          </div>
          <div>
            <span>Generated</span>
            <strong>{formatDateTimeUTC(model.meta.generatedAt)}</strong>
          </div>
          <div>
            <span>Data as of</span>
            <strong>
              {model.meta.dataAsOf
                ? formatDateTimeUTC(model.meta.dataAsOf)
                : "—"}
            </strong>
          </div>
          <div>
            <span>Focus states</span>
            <strong>{model.meta.focusStates.join(", ")}</strong>
          </div>
        </div>
      </section>

      {/* Executive summary + TOC */}
      <section className="frontmatter">
        <h2 className="section-title">Executive Summary</h2>
        <p>{execSummary}</p>
        <h2 className="section-title toc-title">Contents</h2>
        <ol className="toc">
          {chapters.map((c) => (
            <li key={c.id}>
              <span className="toc-num">{c.id}</span>
              <span className="toc-name">{c.title}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Chapters */}
      {chapters.map((chapter) => (
        <section className="chapter" key={chapter.id}>
          <h2 className="chapter-title">
            <span className="chapter-num">{chapter.id}</span>
            {chapter.title}
          </h2>
          {chapter.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {chapter.kind === "data" ? (
            <DataChapterBody
              chapter={chapter}
              model={model}
              options={options}
            />
          ) : null}
        </section>
      ))}
    </div>
  );
}

const REPORT_CSS = `
.report {
  color: #0f172a;
  background: #ffffff;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  max-width: 820px;
  margin: 0 auto;
  padding: 24px;
}
.report p { margin: 0 0 10px; }
.report h1, .report h2, .report h3 { color: #0f172a; line-height: 1.2; font-weight: 700; }
.report .muted { color: #94a3b8; }
.report .note { font-size: 10pt; color: #475569; }
.report .empty { font-size: 10pt; color: #64748b; font-style: italic; }

.cover { padding: 48px 8px; border-bottom: 3px solid #dc2626; }
.cover-kicker { font-size: 10pt; letter-spacing: 0.08em; text-transform: uppercase; color: #dc2626; font-weight: 700; }
.cover-title { font-size: 30pt; margin: 18px 0 8px; letter-spacing: -0.01em; }
.cover-subtitle { font-size: 13pt; color: #475569; margin: 0 0 32px; }
.cover-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; font-size: 10.5pt; }
.cover-meta div { display: flex; flex-direction: column; }
.cover-meta span { color: #64748b; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.04em; }
.cover-meta strong { color: #0f172a; font-weight: 600; }

.section-title { font-size: 16pt; margin: 8px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
.toc-title { margin-top: 28px; }
.toc { list-style: none; padding: 0; margin: 8px 0 0; }
.toc li { display: flex; align-items: baseline; gap: 12px; padding: 5px 0; border-bottom: 1px dotted #e2e8f0; font-size: 11pt; }
.toc-num { display: inline-block; min-width: 22px; font-weight: 700; color: #dc2626; }

.chapter { margin-top: 8px; }
.chapter-title { font-size: 18pt; margin: 0 0 14px; display: flex; align-items: center; gap: 12px; }
.chapter-num { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: #0f172a; color: #fff; font-size: 13pt; }
.chapter h3 { font-size: 12.5pt; margin: 18px 0 6px; }

.report table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 12px 0; }
.report th, .report td { border: 1px solid #e2e8f0; padding: 6px 9px; text-align: left; vertical-align: top; }
.report thead th { background: #f1f5f9; font-weight: 600; }
.report .total-row td { background: #f8fafc; font-weight: 700; }

figure { margin: 16px 0; break-inside: avoid; page-break-inside: avoid; }
figcaption { font-size: 9pt; color: #64748b; margin-top: 6px; font-style: italic; }

.chip { color: #fff; padding: 1px 7px; border-radius: 4px; font-size: 8.5pt; font-weight: 700; white-space: nowrap; }

.stat-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
.stat { flex: 1 1 120px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
.stat-value { display: block; font-size: 17pt; font-weight: 700; }
.stat-label { display: block; font-size: 8.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }

.findings, .recommendations { padding-left: 20px; margin: 8px 0; }
.findings li, .recommendations li { margin: 0 0 8px; }

@media print {
  @page { size: A4; margin: 16mm 14mm; }
  .report { max-width: none; margin: 0; padding: 0; font-size: 10.5pt; }
  .cover { min-height: 250mm; display: flex; flex-direction: column; justify-content: center; break-after: page; page-break-after: always; }
  .frontmatter { break-after: page; page-break-after: always; }
  .chapter { break-before: page; page-break-before: always; }
  h2, h3 { break-after: avoid; page-break-after: avoid; }
  tr, figure { break-inside: avoid; page-break-inside: avoid; }
}
`;
