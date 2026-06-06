import { useState } from "react";

const pages = [
  {
    id: "p1",
    label: "Page 1",
    title: "Executive Overview",
    emoji: "📊",
    color: "#4f9cf9",
    kpis: [
      {
        name: "Total Active Shortages",
        dax: `Total Active Shortages = 
CALCULATE(
    COUNTROWS(vw_shortage_main),
    vw_shortage_main[status] = "ACTIVE"
)`,
        howto: "Insert → Card visual → drag 'Total Active Shortages' measure into Fields"
      },
      {
        name: "Critical Shortages",
        dax: `Critical Shortages = 
CALCULATE(
    COUNTROWS(vw_shortage_main),
    vw_shortage_main[criticality_tier] = "CRITICAL"
)`,
        howto: "Insert → Card visual → drag 'Critical Shortages' measure into Fields"
      },
      {
        name: "Avg Risk Score",
        dax: `Avg Risk Score = 
AVERAGE(vw_shortage_main[risk_score])`,
        howto: "Insert → Card visual → drag 'Avg Risk Score' measure → Format → Values → Decimal places: 1"
      },
      {
        name: "Avg Duration (Days)",
        dax: `Avg Duration Days = 
AVERAGE(vw_shortage_main[duration_days])`,
        howto: "Insert → Card visual → drag 'Avg Duration Days' → Format → Values → Decimal places: 0"
      },
      {
        name: "Resolution Rate %",
        dax: `Resolution Rate % = 
DIVIDE(
    CALCULATE(COUNTROWS(vw_shortage_main), vw_shortage_main[is_resolved] = TRUE()),
    COUNTROWS(vw_shortage_main),
    0
) * 100`,
        howto: "Insert → Card visual → drag 'Resolution Rate %' → Format → Values → Decimal places: 1"
      },
    ],
    charts: [
      {
        name: "Monthly Shortage Trend",
        type: "Line Chart",
        view: "vw_monthly_trends",
        config: "X-axis: month | Y-axis: shortage_count | Legend: status",
        howto: [
          "Insert → Line chart",
          "X-axis → drag month (from vw_monthly_trends)",
          "Y-axis → drag shortage_count",
          "Legend → drag status",
          "Format → Data colors: ACTIVE=red, RESOLVED=green",
        ]
      },
      {
        name: "Shortages by Status",
        type: "Donut Chart",
        view: "vw_shortage_main",
        config: "Legend: status | Values: Count of shortage_id",
        howto: [
          "Insert → Donut chart",
          "Legend → drag status",
          "Values → drag shortage_id → change aggregation to Count",
          "Format → Detail labels: On | Legend: On",
        ]
      },
      {
        name: "Top 10 Therapeutic Categories",
        type: "Bar Chart (Horizontal)",
        view: "vw_shortage_main",
        config: "Y-axis: therapeutic_category | X-axis: Count of shortage_id | Filter: Top N = 10",
        howto: [
          "Insert → Clustered bar chart",
          "Y-axis → drag therapeutic_category",
          "X-axis → drag shortage_id → Count",
          "Filters pane → therapeutic_category → Filter type: Top N → Top 10 by Count of shortage_id",
          "Sort by count descending",
        ]
      },
      {
        name: "Active vs Resolved by Category",
        type: "Stacked Bar Chart",
        view: "vw_monthly_trends",
        config: "Y-axis: therapeutic_category | X-axis: shortage_count | Legend: status",
        howto: [
          "Insert → Stacked bar chart",
          "Y-axis → drag therapeutic_category",
          "X-axis → drag shortage_count",
          "Legend → drag status",
          "Format → Data colors: ACTIVE=red, RESOLVED=teal",
        ]
      },
      {
        name: "Critical Shortages MoM",
        type: "Line Chart",
        view: "vw_monthly_trends",
        config: "X-axis: month | Y-axis: critical_count",
        howto: [
          "Insert → Line chart",
          "X-axis → drag month",
          "Y-axis → drag critical_count",
          "Format → Line → stroke width: 3px | Color: red",
          "Add constant line at average: Analytics pane → Average line",
        ]
      },
      {
        name: "Shortage Count by WHO Region",
        type: "Stacked Column Chart",
        view: "vw_monthly_trends",
        config: "X-axis: month | Y-axis: shortage_count | Legend: who_region",
        howto: [
          "Insert → Stacked column chart",
          "X-axis → drag month",
          "Y-axis → drag shortage_count",
          "Legend → drag who_region",
        ]
      },
      {
        name: "Latest 10 Shortages Table",
        type: "Table",
        view: "vw_shortage_main",
        config: "Columns: drug_name, status, risk_score, shortage_start_date | Sort: shortage_start_date DESC | Filter: Top 10",
        howto: [
          "Insert → Table visual",
          "Columns → drag: drug_name, status, risk_score, shortage_start_date",
          "Sort by shortage_start_date → Descending",
          "Filters pane → shortage_start_date → Top N: 10",
          "Format → Conditional formatting on risk_score: 0-25=green, 26-50=yellow, 51-75=orange, 76-100=red",
        ]
      },
    ]
  },
  {
    id: "p2",
    label: "Page 2",
    title: "Drug Intelligence",
    emoji: "💊",
    color: "#00d4aa",
    kpis: [
      {
        name: "Total Unique Drugs",
        dax: `Total Unique Drugs = 
DISTINCTCOUNT(vw_shortage_main[drug_name])`,
        howto: "Insert → Card visual → drag 'Total Unique Drugs'"
      },
      {
        name: "Essential Drugs in Shortage",
        dax: `Essential Drugs in Shortage = 
CALCULATE(
    DISTINCTCOUNT(vw_shortage_main[drug_name]),
    vw_shortage_main[is_essential] = TRUE()
)`,
        howto: "Insert → Card visual → drag 'Essential Drugs in Shortage'"
      },
      {
        name: "Avg Risk Score (Critical Only)",
        dax: `Avg Risk Score Critical = 
CALCULATE(
    AVERAGE(vw_shortage_main[risk_score]),
    vw_shortage_main[criticality_tier] = "CRITICAL"
)`,
        howto: "Insert → Card visual → drag measure → Format → Decimal: 1"
      },
      {
        name: "Drugs with Active Shortages",
        dax: `Drugs Active Shortages = 
CALCULATE(
    DISTINCTCOUNT(vw_shortage_main[drug_name]),
    vw_shortage_main[status] = "ACTIVE"
)`,
        howto: "Insert → Card visual → drag 'Drugs Active Shortages'"
      },
    ],
    charts: [
      {
        name: "Top 15 Drugs by Total Shortages",
        type: "Bar Chart (Horizontal)",
        view: "vw_drug_risk",
        config: "Y-axis: drug_name | X-axis: total_shortages | Filter: Top 15",
        howto: [
          "Insert → Clustered bar chart",
          "Y-axis → drag drug_name",
          "X-axis → drag total_shortages",
          "Filters pane → drug_name → Top N: 15 by total_shortages",
          "Sort descending by total_shortages",
        ]
      },
      {
        name: "Risk Score vs Avg Duration",
        type: "Scatter Plot",
        view: "vw_drug_risk",
        config: "X-axis: risk_score | Y-axis: avg_duration_days | Details: drug_name | Size: total_shortages",
        howto: [
          "Insert → Scatter chart",
          "X-axis → drag risk_score",
          "Y-axis → drag avg_duration_days",
          "Details → drag drug_name",
          "Size → drag total_shortages",
          "Format → Data colors: by criticality_tier",
        ]
      },
      {
        name: "Drugs by Criticality Tier",
        type: "Donut Chart",
        view: "vw_drug_risk",
        config: "Legend: criticality_tier | Values: Count of drug_name",
        howto: [
          "Insert → Donut chart",
          "Legend → drag criticality_tier",
          "Values → drag drug_name → Count",
          "Format → Colors: CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green",
        ]
      },
      {
        name: "Essential vs Non-Essential",
        type: "Clustered Column Chart",
        view: "vw_drug_risk",
        config: "X-axis: is_essential | Y-axis: total_shortages | Legend: criticality_tier",
        howto: [
          "Insert → Clustered column chart",
          "X-axis → drag is_essential",
          "Y-axis → drag total_shortages",
          "Legend → drag criticality_tier",
          "Format → X-axis labels: rename TRUE=Essential, FALSE=Non-Essential (use a calculated column or rename in model)",
        ]
      },
      {
        name: "Drug × Status Risk Heatmap",
        type: "Matrix",
        view: "vw_shortage_main",
        config: "Rows: drug_name | Columns: status | Values: Avg risk_score | Filter: Top 15 drugs",
        howto: [
          "Insert → Matrix visual",
          "Rows → drag drug_name",
          "Columns → drag status",
          "Values → drag risk_score → Average",
          "Format → Conditional formatting on Values → Color scale: green→red",
          "Filters: Top 15 drugs by total shortages",
        ]
      },
      {
        name: "Top Drugs by Active Shortages",
        type: "Bar Chart (Horizontal)",
        view: "vw_drug_risk",
        config: "Y-axis: drug_name | X-axis: active_shortages | Filter: Top 10",
        howto: [
          "Insert → Clustered bar chart",
          "Y-axis → drug_name",
          "X-axis → active_shortages",
          "Filters: Top N 10 by active_shortages",
          "Format → Bar color: #EF4444 (red) to highlight urgency",
        ]
      },
      {
        name: "Monthly Trend for Selected Drug",
        type: "Line Chart",
        view: "vw_monthly_trends",
        config: "X-axis: month | Y-axis: shortage_count | Slicer: drug_name (from vw_drug_risk)",
        howto: [
          "Insert → Line chart",
          "X-axis → month | Y-axis → shortage_count",
          "Insert → Slicer → drag drug_name onto it",
          "This chart will filter when user picks a drug from the slicer",
        ]
      },
      {
        name: "Full Drug Detail Table",
        type: "Table",
        view: "vw_drug_risk",
        config: "Columns: drug_name, risk_score, criticality_tier, total_shortages, active_shortages, avg_duration_days",
        howto: [
          "Insert → Table visual",
          "Drag all columns: drug_name, risk_score, criticality_tier, total_shortages, active_shortages, avg_duration_days",
          "Sort by risk_score descending",
          "Format → Conditional formatting on risk_score column → Background color scale",
          "Format → Column widths: auto-fit",
        ]
      },
    ]
  },
  {
    id: "p3",
    label: "Page 3",
    title: "Manufacturer Performance",
    emoji: "🏭",
    color: "#a855f7",
    kpis: [
      {
        name: "Total Manufacturers",
        dax: `Total Manufacturers = 
DISTINCTCOUNT(vw_manufacturer_perf[manufacturer])`,
        howto: "Insert → Card visual → drag 'Total Manufacturers'"
      },
      {
        name: "Avg Resolution Rate %",
        dax: `Avg Resolution Rate = 
AVERAGE(vw_manufacturer_perf[resolution_rate_pct])`,
        howto: "Insert → Card visual → drag 'Avg Resolution Rate' → Format → Decimal: 1"
      },
      {
        name: "Manufacturers with Active Shortages",
        dax: `Mfr With Active Shortages = 
CALCULATE(
    DISTINCTCOUNT(vw_shortage_main[manufacturer]),
    vw_shortage_main[status] = "ACTIVE"
)`,
        howto: "Insert → Card visual → drag measure"
      },
      {
        name: "Avg Drugs Affected per Manufacturer",
        dax: `Avg Drugs Per Mfr = 
AVERAGE(vw_manufacturer_perf[drugs_affected])`,
        howto: "Insert → Card visual → Format → Decimal: 1"
      },
    ],
    charts: [
      {
        name: "Top 15 Manufacturers by Total Shortages",
        type: "Bar Chart (Horizontal)",
        view: "vw_manufacturer_perf",
        config: "Y-axis: manufacturer | X-axis: total_shortages | Filter: Top 15",
        howto: [
          "Insert → Clustered bar chart",
          "Y-axis → manufacturer | X-axis → total_shortages",
          "Filters: Top N 15 by total_shortages",
          "Sort descending",
        ]
      },
      {
        name: "Manufacturers by Active Shortages",
        type: "Bar Chart (Horizontal)",
        view: "vw_manufacturer_perf",
        config: "Y-axis: manufacturer | X-axis: active_shortages | Filter: Top 10",
        howto: [
          "Insert → Clustered bar chart",
          "Y-axis → manufacturer | X-axis → active_shortages",
          "Filters: Top N 10 by active_shortages",
          "Format → Bar color: red to signal urgency",
        ]
      },
      {
        name: "Total Shortages vs Resolution Rate",
        type: "Scatter Plot",
        view: "vw_manufacturer_perf",
        config: "X-axis: total_shortages | Y-axis: resolution_rate_pct | Details: manufacturer | Size: drugs_affected",
        howto: [
          "Insert → Scatter chart",
          "X-axis → total_shortages",
          "Y-axis → resolution_rate_pct",
          "Details → manufacturer",
          "Size → drugs_affected",
          "Analytics pane → add Average line on both axes to create 4 quadrants",
        ]
      },
      {
        name: "Top Manufacturers by Drugs Affected",
        type: "Bar Chart (Horizontal)",
        view: "vw_manufacturer_perf",
        config: "Y-axis: manufacturer | X-axis: drugs_affected | Filter: Top 10",
        howto: [
          "Insert → Clustered bar chart",
          "Y-axis → manufacturer | X-axis → drugs_affected",
          "Filters: Top N 10 by drugs_affected",
        ]
      },
      {
        name: "Avg Duration by Manufacturer",
        type: "Bar Chart (Horizontal)",
        view: "vw_manufacturer_perf",
        config: "Y-axis: manufacturer | X-axis: avg_duration | Filter: Top 10",
        howto: [
          "Insert → Clustered bar chart",
          "Y-axis → manufacturer | X-axis → avg_duration",
          "Filters: Top N 10 by avg_duration",
          "Format → Bar color: gradient from green (short) to red (long)",
          "Sort descending",
        ]
      },
      {
        name: "Share of Shortages: Top 5 vs Others",
        type: "Donut Chart",
        view: "vw_manufacturer_perf",
        config: "Use a DAX measure to group top 5 manufacturers vs 'Others'",
        dax: `Manufacturer Group = 
VAR top5 = TOPN(5, ALL(vw_manufacturer_perf[manufacturer]), vw_manufacturer_perf[total_shortages])
RETURN
IF(SELECTEDVALUE(vw_manufacturer_perf[manufacturer]) IN top5,
    SELECTEDVALUE(vw_manufacturer_perf[manufacturer]),
    "Others"
)`,
        howto: [
          "Create a new calculated column: Manufacturer Group (DAX above)",
          "Insert → Donut chart",
          "Legend → Manufacturer Group",
          "Values → total_shortages (Sum)",
        ]
      },
      {
        name: "Full Manufacturer Detail Table",
        type: "Table",
        view: "vw_manufacturer_perf",
        config: "Columns: manufacturer, total_shortages, active_shortages, drugs_affected, avg_duration, resolution_rate_pct",
        howto: [
          "Insert → Table visual",
          "Drag all columns: manufacturer, total_shortages, active_shortages, drugs_affected, avg_duration, resolution_rate_pct",
          "Sort by total_shortages descending",
          "Format → Conditional formatting on resolution_rate_pct: green=high, red=low",
          "Format → Conditional formatting on active_shortages: red scale",
        ]
      },
    ]
  }
];

const slicers = [
  { name: "Status", view: "vw_shortage_main", field: "status", type: "Dropdown or List" },
  { name: "Therapeutic Category", view: "vw_shortage_main", field: "therapeutic_category", type: "Dropdown" },
  { name: "Criticality Tier", view: "vw_shortage_main", field: "criticality_tier", type: "List (4 values)" },
  { name: "Date Range", view: "vw_shortage_main", field: "shortage_start_date", type: "Between (date range picker)" },
];

export default function PowerBIGuide() {
  const [activePage, setActivePage] = useState(0);
  const [activeTab, setActiveTab] = useState("kpi");
  const [expandedItem, setExpandedItem] = useState(null);
  const [copied, setCopied] = useState(null);

  const page = pages[activePage];

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070d0a",
      fontFamily: "'DM Sans', sans-serif",
      color: "#cdd9e5",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d1f1a, #0a1628)",
        borderBottom: "1px solid #ffffff15",
        padding: "18px 28px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#e6edf3" }}>📊 Power BI Dashboard Guide</div>
          <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "2px" }}>DAX Measures + Step-by-step chart instructions · 3 Pages · 4 Views</div>
        </div>
      </div>

      {/* Page tabs */}
      <div style={{ display: "flex", background: "#0a1410", borderBottom: "1px solid #ffffff10" }}>
        {pages.map((p, i) => (
          <button key={i} onClick={() => { setActivePage(i); setActiveTab("kpi"); setExpandedItem(null); }}
            style={{
              padding: "13px 22px", background: "transparent", border: "none",
              borderBottom: activePage === i ? `3px solid ${p.color}` : "3px solid transparent",
              cursor: "pointer", color: activePage === i ? p.color : "#8b949e",
              fontSize: "13px", fontWeight: activePage === i ? 700 : 400,
            }}>
            {p.emoji} {p.label}
            <div style={{ fontSize: "10px", marginTop: "2px", color: activePage === i ? p.color + "99" : "#444" }}>{p.title}</div>
          </button>
        ))}
        <button onClick={() => { setActivePage(3); setActiveTab("slicers"); setExpandedItem(null); }}
          style={{
            padding: "13px 22px", background: "transparent", border: "none",
            borderBottom: activePage === 3 ? "3px solid #f59e0b" : "3px solid transparent",
            cursor: "pointer", color: activePage === 3 ? "#f59e0b" : "#8b949e",
            fontSize: "13px", fontWeight: activePage === 3 ? 700 : 400,
          }}>
          🎛️ Slicers
          <div style={{ fontSize: "10px", marginTop: "2px", color: activePage === 3 ? "#f59e0b99" : "#444" }}>All pages</div>
        </button>
      </div>

      {/* Slicers page */}
      {activePage === 3 ? (
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "28px 20px 60px" }}>
          <div style={{
            background: "#f59e0b15", border: "1px solid #f59e0b40",
            borderRadius: "12px", padding: "20px 24px", marginBottom: "24px"
          }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#e6edf3" }}>🎛️ Slicers — Add to Every Page</div>
            <div style={{ color: "#8b949e", fontSize: "13px", marginTop: "4px" }}>These filters let users drill down across all charts on the page simultaneously.</div>
          </div>
          {slicers.map((s, i) => (
            <div key={i} style={{
              background: "#0d1f1a", border: "1px solid #f59e0b30",
              borderLeft: "4px solid #f59e0b", borderRadius: "10px",
              padding: "18px 22px", marginBottom: "12px"
            }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#e6edf3" }}>{s.name}</div>
              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ background: "#ffffff10", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#8b949e" }}>View: <span style={{ color: "#f59e0b" }}>{s.view}</span></span>
                <span style={{ background: "#ffffff10", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#8b949e" }}>Field: <span style={{ color: "#e6edf3" }}>{s.field}</span></span>
                <span style={{ background: "#ffffff10", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#8b949e" }}>Type: <span style={{ color: "#e6edf3" }}>{s.type}</span></span>
              </div>
              <div style={{ marginTop: "12px", background: "#0a1117", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600, marginBottom: "6px" }}>How to add:</div>
                {["Insert → Slicer visual",
                  `Field → drag ${s.field} from ${s.view}`,
                  `Format → Slicer settings → Style: ${s.type}`,
                  "Resize and place in top-right or left sidebar of the page"
                ].map((step, si) => (
                  <div key={si} style={{ display: "flex", gap: "10px", marginBottom: "4px", alignItems: "flex-start" }}>
                    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "11px", minWidth: "16px", marginTop: "2px" }}>{si + 1}.</span>
                    <span style={{ fontSize: "12px", color: "#cdd9e5", lineHeight: "1.5" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "28px 20px 60px" }}>
          {/* Page header */}
          <div style={{
            background: `linear-gradient(135deg, ${page.color}15, #0a1628)`,
            border: `1px solid ${page.color}40`, borderRadius: "12px",
            padding: "20px 24px", marginBottom: "24px",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px"
          }}>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#e6edf3" }}>{page.emoji} {page.title}</div>
              <div style={{ color: "#8b949e", fontSize: "13px", marginTop: "4px" }}>
                {page.kpis.length} KPI cards · {page.charts.length} charts
              </div>
            </div>
          </div>

          {/* Sub tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {["kpi", "charts"].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setExpandedItem(null); }}
                style={{
                  padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
                  background: activeTab === tab ? page.color : "#0d1f1a",
                  color: activeTab === tab ? "#070d0a" : "#8b949e",
                  fontWeight: activeTab === tab ? 700 : 400, fontSize: "13px",
                  border: `1px solid ${activeTab === tab ? page.color : "#ffffff15"}`,
                }}>
                {tab === "kpi" ? `📌 KPI Cards (${page.kpis.length})` : `📈 Charts (${page.charts.length})`}
              </button>
            ))}
          </div>

          {/* KPIs */}
          {activeTab === "kpi" && page.kpis.map((kpi, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div onClick={() => setExpandedItem(expandedItem === `kpi-${i}` ? null : `kpi-${i}`)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  background: expandedItem === `kpi-${i}` ? "#0d1f1a" : "#0a1410",
                  border: `1px solid ${expandedItem === `kpi-${i}` ? page.color + "50" : "#ffffff10"}`,
                  borderLeft: `4px solid ${page.color}`,
                  borderRadius: expandedItem === `kpi-${i}` ? "10px 10px 0 0" : "10px",
                  padding: "14px 20px", cursor: "pointer",
                }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                  background: page.color + "25", border: `2px solid ${page.color}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: page.color, fontWeight: 700, fontSize: "12px",
                }}>K{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e6edf3", fontSize: "14px", fontWeight: 600 }}>{kpi.name}</div>
                  <div style={{ color: "#8b949e", fontSize: "11px", marginTop: "2px" }}>Click to see DAX + how to add</div>
                </div>
                <div style={{ color: "#8b949e" }}>{expandedItem === `kpi-${i}` ? "▲" : "▼"}</div>
              </div>

              {expandedItem === `kpi-${i}` && (
                <div style={{
                  background: "#0d1f1a", border: `1px solid ${page.color}20`,
                  borderTop: "none", borderRadius: "0 0 10px 10px", padding: "18px 20px"
                }}>
                  {/* DAX */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "12px", color: page.color, fontWeight: 700, marginBottom: "8px" }}>DAX MEASURE</div>
                    <div style={{ position: "relative" }}>
                      <pre style={{
                        background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px",
                        padding: "12px 14px", fontFamily: "'Fira Code', monospace",
                        fontSize: "12px", color: "#e6edf3", whiteSpace: "pre-wrap",
                        margin: 0, lineHeight: "1.7"
                      }}>{kpi.dax}</pre>
                      <button onClick={() => copy(kpi.dax, `kpi-${i}`)} style={{
                        position: "absolute", top: "8px", right: "8px",
                        background: copied === `kpi-${i}` ? "#22c55e20" : "#1e2d24",
                        border: `1px solid ${copied === `kpi-${i}` ? "#22c55e" : "#30363d"}`,
                        borderRadius: "5px", padding: "3px 10px",
                        color: copied === `kpi-${i}` ? "#22c55e" : "#8b949e",
                        fontSize: "11px", cursor: "pointer", fontWeight: 600,
                      }}>{copied === `kpi-${i}` ? "✓ Copied!" : "Copy"}</button>
                    </div>
                  </div>
                  {/* How to */}
                  <div>
                    <div style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 700, marginBottom: "8px" }}>HOW TO ADD IN POWER BI</div>
                    <div style={{ background: "#0a1117", borderRadius: "8px", padding: "12px 14px" }}>
                      <div style={{ fontSize: "12px", color: "#cdd9e5", lineHeight: "1.8" }}>
                        <div style={{ marginBottom: "6px" }}>1. <strong style={{ color: "#e6edf3" }}>Create measure:</strong> Home tab → New Measure → paste DAX above → Enter</div>
                        <div>{`2. `}<strong style={{ color: "#e6edf3" }}>Add card:</strong> {kpi.howto}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Charts */}
          {activeTab === "charts" && page.charts.map((chart, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div onClick={() => setExpandedItem(expandedItem === `chart-${i}` ? null : `chart-${i}`)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  background: expandedItem === `chart-${i}` ? "#0d1f1a" : "#0a1410",
                  border: `1px solid ${expandedItem === `chart-${i}` ? page.color + "50" : "#ffffff10"}`,
                  borderLeft: `4px solid ${page.color}`,
                  borderRadius: expandedItem === `chart-${i}` ? "10px 10px 0 0" : "10px",
                  padding: "14px 20px", cursor: "pointer",
                }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                  background: page.color + "25", border: `2px solid ${page.color}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: page.color, fontWeight: 700, fontSize: "12px",
                }}>C{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e6edf3", fontSize: "14px", fontWeight: 600 }}>{chart.name}</div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ background: page.color + "20", color: page.color, fontSize: "10px", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{chart.type}</span>
                    <span style={{ background: "#ffffff10", color: "#8b949e", fontSize: "10px", padding: "2px 8px", borderRadius: "4px" }}>{chart.view}</span>
                  </div>
                </div>
                <div style={{ color: "#8b949e" }}>{expandedItem === `chart-${i}` ? "▲" : "▼"}</div>
              </div>

              {expandedItem === `chart-${i}` && (
                <div style={{
                  background: "#0d1f1a", border: `1px solid ${page.color}20`,
                  borderTop: "none", borderRadius: "0 0 10px 10px", padding: "18px 20px"
                }}>
                  {/* Config summary */}
                  <div style={{
                    background: "#0a1117", borderRadius: "8px", padding: "10px 14px",
                    marginBottom: "14px", fontSize: "12px", color: "#8b949e", lineHeight: "1.7"
                  }}>
                    <span style={{ color: page.color, fontWeight: 600 }}>Config: </span>{chart.config}
                  </div>

                  {/* Extra DAX if present */}
                  {chart.dax && (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", color: page.color, fontWeight: 700, marginBottom: "8px" }}>EXTRA DAX NEEDED</div>
                      <div style={{ position: "relative" }}>
                        <pre style={{
                          background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px",
                          padding: "12px 14px", fontFamily: "'Fira Code', monospace",
                          fontSize: "12px", color: "#e6edf3", whiteSpace: "pre-wrap",
                          margin: 0, lineHeight: "1.7"
                        }}>{chart.dax}</pre>
                        <button onClick={() => copy(chart.dax, `chart-dax-${i}`)} style={{
                          position: "absolute", top: "8px", right: "8px",
                          background: copied === `chart-dax-${i}` ? "#22c55e20" : "#1e2d24",
                          border: `1px solid ${copied === `chart-dax-${i}` ? "#22c55e" : "#30363d"}`,
                          borderRadius: "5px", padding: "3px 10px",
                          color: copied === `chart-dax-${i}` ? "#22c55e" : "#8b949e",
                          fontSize: "11px", cursor: "pointer", fontWeight: 600,
                        }}>{copied === `chart-dax-${i}` ? "✓ Copied!" : "Copy"}</button>
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  <div>
                    <div style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 700, marginBottom: "8px" }}>STEP-BY-STEP IN POWER BI</div>
                    <div style={{ background: "#0a1117", borderRadius: "8px", padding: "12px 14px" }}>
                      {chart.howto.map((step, si) => (
                        <div key={si} style={{ display: "flex", gap: "10px", marginBottom: "6px", alignItems: "flex-start" }}>
                          <span style={{
                            color: page.color, fontWeight: 700, fontSize: "11px",
                            minWidth: "18px", marginTop: "2px"
                          }}>{si + 1}.</span>
                          <span style={{ fontSize: "12px", color: "#cdd9e5", lineHeight: "1.6" }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
