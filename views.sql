-- Run in SSMS Query Editor (F5 to execute)
USE pharma_db;
GO

-- Drop all 4 views first
DROP VIEW IF EXISTS analytics.vw_shortage_main;
DROP VIEW IF EXISTS analytics.vw_monthly_trends;
DROP VIEW IF EXISTS analytics.vw_drug_risk;
DROP VIEW IF EXISTS analytics.vw_manufacturer_perf;
GO

-- Drop and recreate so they pick up the new therapeutic_category column
USE pharma_db;
GO

CREATE OR ALTER VIEW analytics.vw_shortage_main AS
SELECT
    f.shortage_id,
    d.generic_name              AS drug_name,
    d.therapeutic_category,
    d.risk_score,
    d.criticality_tier,
    d.is_essential,
    m.company_name              AS manufacturer,
    m.country_of_origin         AS mfr_country,
    r.country_name              AS region,
    r.who_region,
    s.source_name               AS data_source,
    f.status,
    f.reason_detail             AS shortage_reason,
    f.presentation,
    f.shortage_start_date,
    f.shortage_end_date,
    CASE
        WHEN f.shortage_end_date IS NOT NULL
        THEN DATEDIFF(day, f.shortage_start_date, f.shortage_end_date)
        ELSE DATEDIFF(day, f.shortage_start_date, CAST(GETDATE() AS DATE))
    END                         AS duration_days,
    f.is_critical,
    f.is_resolved,
    f.ingested_at
FROM core.fact_shortage f
LEFT JOIN core.dim_drug d         ON d.drug_id = f.drug_id
LEFT JOIN core.dim_manufacturer m ON m.manufacturer_id = f.manufacturer_id
LEFT JOIN core.dim_region r       ON r.region_id = f.region_id
LEFT JOIN core.dim_source s       ON s.source_id = f.source_id;
GO

CREATE OR ALTER VIEW analytics.vw_monthly_trends AS
SELECT
    DATEFROMPARTS(YEAR(shortage_start_date), MONTH(shortage_start_date), 1) AS month,
    YEAR(shortage_start_date)   AS year,
    MONTH(shortage_start_date)  AS month_num,
    status,
    therapeutic_category,
    who_region,
    COUNT(*)                    AS shortage_count,
    AVG(CAST(duration_days AS FLOAT)) AS avg_duration,
    SUM(CASE WHEN is_critical = 1 THEN 1 ELSE 0 END) AS critical_count
FROM analytics.vw_shortage_main
WHERE shortage_start_date IS NOT NULL
GROUP BY
    DATEFROMPARTS(YEAR(shortage_start_date), MONTH(shortage_start_date), 1),
    YEAR(shortage_start_date),
    MONTH(shortage_start_date),
    status, therapeutic_category, who_region;
GO

CREATE OR ALTER VIEW analytics.vw_drug_risk AS
SELECT
    drug_name,
    therapeutic_category,
    risk_score,
    criticality_tier,
    is_essential,
    COUNT(*)  AS total_shortages,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_shortages,
    AVG(CAST(duration_days AS FLOAT)) AS avg_duration_days,
    MAX(shortage_start_date) AS last_shortage_date
FROM analytics.vw_shortage_main
GROUP BY drug_name, therapeutic_category, risk_score, criticality_tier, is_essential;
GO

CREATE OR ALTER VIEW analytics.vw_manufacturer_perf AS
SELECT
    manufacturer,
    COUNT(*)  AS total_shortages,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_shortages,
    COUNT(DISTINCT drug_name)   AS drugs_affected,
    AVG(CAST(duration_days AS FLOAT)) AS avg_duration,
    ROUND(
        100.0 * SUM(CASE WHEN is_resolved = 1 THEN 1 ELSE 0 END) / COUNT(*),
    1) AS resolution_rate_pct
FROM analytics.vw_shortage_main
GROUP BY manufacturer;
GO

SELECT 'Views recreated ✅' AS status;


SELECT TOP (10) [drug_name]
      ,[therapeutic_category]
      ,[risk_score]
      ,[criticality_tier]
      ,[is_essential]
      ,[total_shortages]
      ,[active_shortages]
      ,[avg_duration_days]
      ,[last_shortage_date]
  FROM [pharma_db].[analytics].[vw_drug_risk]


  select * from analytics.vw_shortage_main

SELECT
    YEAR(shortage_start_date) AS Yr,
    MONTH(shortage_start_date) AS Mn,
    COUNT(*) AS Cnt
FROM core.fact_shortage
GROUP BY
    YEAR(shortage_start_date),
    MONTH(shortage_start_date)
ORDER BY Yr, Mn;