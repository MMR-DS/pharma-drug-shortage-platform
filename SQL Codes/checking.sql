SELECT TOP (1000) [drug_name]
      ,[therapeutic_category]
      ,[risk_score]
      ,[criticality_tier]
      ,[is_essential]
      ,[total_shortages]
      ,[active_shortages]
      ,[avg_duration_days]
      ,[last_shortage_date]
  FROM [pharma_db].[analytics].[vw_drug_risk]
use pharma_db;
SELECT 
    COUNT(*) as total_records,
    SUM(CASE WHEN shortage_start_date IS NULL THEN 1 ELSE 0 END) as null_dates,
    SUM(CASE WHEN shortage_start_date IS NOT NULL THEN 1 ELSE 0 END) as valid_dates
FROM core.fact_shortage;

-- See sample of dates
SELECT TOP 10 
    shortage_start_date, 
    shortage_end_date,
    status
FROM core.fact_shortage
ORDER BY ingested_at DESC;
