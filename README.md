# 💊 Pharma Drug Shortage Platform

An end-to-end drug shortage risk analytics platform that collects, 
processes, and visualizes FDA drug shortage data.

## 🛠️ Tech Stack
- **Python** — ETL pipeline, FDA API data ingestion, risk scoring
- SQL** — Star schema data warehouse + 4 analytics views
- **Power BI** — Interactive 3-page dashboard

## 📁 Project Structure
- `sql/` — Schema creation + all 4 analytics views
- `python/` — ETL pipeline scripts
- `powerbi/` — Power BI dashboard file (.pbix)

## 🗄️ Database Views
| View | Purpose |
|------|---------|
| vw_shortage_main | Core shortage data with risk scores |
| vw_monthly_trends | Month-over-month trend analysis |
| vw_drug_risk | Per-drug risk scoring & criticality |
| vw_manufacturer_perf | Manufacturer performance metrics |

## 📊 Dashboard Pages
- ✅ Page 1: Executive Overview
- ✅ Page 2: Drug Intelligence
- 🔄 Page 3: Manufacturer Performance *(in progress)*

## ⚙️ How to Run
1. Set up PostgreSQL and run `sql/schema.sql`
2. Install dependencies: `pip install -r python/requirements.txt`
3. Run the pipeline: `python python/pipeline.py`
4. Open `powerbi/pharma_shortage.pbix` and refresh data

## 📌 Data Source
FDA Drug Shortage Database
