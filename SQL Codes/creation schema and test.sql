USE pharma_db;
GO

-- Create schemas
CREATE SCHEMA staging;
GO
CREATE SCHEMA core;
GO
CREATE SCHEMA analytics;
GO

-- DATE DIMENSION
CREATE TABLE core.dim_date (
    date_id       INT IDENTITY(1,1) PRIMARY KEY,
    full_date     DATE NOT NULL UNIQUE,
    year          SMALLINT,
    quarter       SMALLINT,
    month         SMALLINT,
    month_name    NVARCHAR(10),
    week_of_year  SMALLINT,
    day_of_week   SMALLINT,
    day_name      NVARCHAR(10),
    is_weekend    BIT DEFAULT 0
);

-- DRUG DIMENSION
CREATE TABLE core.dim_drug (
    drug_id               INT IDENTITY(1,1) PRIMARY KEY,
    generic_name          NVARCHAR(300) NOT NULL,
    normalized_name       NVARCHAR(300),
    therapeutic_category  NVARCHAR(150),
    is_essential          BIT DEFAULT 0,
    criticality_tier      NVARCHAR(20) DEFAULT 'MEDIUM',
    risk_score            DECIMAL(5,2) DEFAULT 0,
    created_at            DATETIME DEFAULT GETDATE()
);

-- MANUFACTURER DIMENSION
CREATE TABLE core.dim_manufacturer (
    manufacturer_id   INT IDENTITY(1,1) PRIMARY KEY,
    company_name      NVARCHAR(200) NOT NULL,
    country_of_origin NCHAR(2),
    is_sole_supplier  BIT DEFAULT 0,
    created_at        DATETIME DEFAULT GETDATE()
);

-- REGION DIMENSION
CREATE TABLE core.dim_region (
    region_id    INT IDENTITY(1,1) PRIMARY KEY,
    country_code NCHAR(2),
    country_name NVARCHAR(100),
    who_region   NVARCHAR(50),
    continent    NVARCHAR(50)
);

-- SOURCE DIMENSION
CREATE TABLE core.dim_source (
    source_id   INT IDENTITY(1,1) PRIMARY KEY,
    source_name NVARCHAR(100),
    source_type NVARCHAR(50),
    base_url    NVARCHAR(MAX)
);

-- FACT TABLE
CREATE TABLE core.fact_shortage (
    shortage_id         BIGINT IDENTITY(1,1) PRIMARY KEY,
    drug_id             INT REFERENCES core.dim_drug(drug_id),
    manufacturer_id     INT REFERENCES core.dim_manufacturer(manufacturer_id),
    region_id           INT REFERENCES core.dim_region(region_id),
    source_id           INT REFERENCES core.dim_source(source_id),
    source_record_id    NVARCHAR(100),
    status              NVARCHAR(50),
    reason_category     NVARCHAR(100),
    reason_detail       NVARCHAR(MAX),
    presentation        NVARCHAR(200),
    shortage_start_date DATE,
    shortage_end_date   DATE,
    is_critical         BIT DEFAULT 0,
    is_resolved         BIT DEFAULT 0,
    record_hash         NVARCHAR(64),
    ingested_at         DATETIME DEFAULT GETDATE()
);

-- STAGING TABLE (raw data before cleaning)
CREATE TABLE staging.stg_fda_shortages (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    source_id       NVARCHAR(200),
    drug_name       NVARCHAR(300),
    brand_name      NVARCHAR(300),
    manufacturer    NVARCHAR(200),
    status          NVARCHAR(100),
    reason          NVARCHAR(MAX),
    presentation    NVARCHAR(200),
    shortage_start  NVARCHAR(100),
    shortage_end    NVARCHAR(100),
    source          NVARCHAR(50),
    raw_json        NVARCHAR(MAX),   -- SQL Server uses NVARCHAR(MAX) instead of JSONB
    ingested_at     DATETIME DEFAULT GETDATE()
);

-- Seed source dimension
INSERT INTO core.dim_source (source_name, source_type, base_url) VALUES
('FDA',  'API',    'https://api.fda.gov/drug/shortage.json'),
('ASHP', 'SCRAPE', 'https://www.ashp.org/drug-shortages'),
('EMA',  'SCRAPE', 'https://www.ema.europa.eu'),
('WHO',  'CSV',    'https://www.who.int');

-- Seed region dimension
INSERT INTO core.dim_region (country_code, country_name, who_region, continent) VALUES
('US', 'United States', 'AMRO', 'North America'),
('GB', 'United Kingdom','EURO', 'Europe'),
('DE', 'Germany',       'EURO', 'Europe'),
('IN', 'India',         'SEARO','Asia'),
('CN', 'China',         'WPRO', 'Asia'),
('AU', 'Australia',     'WPRO', 'Oceania'),
('CA', 'Canada',        'AMRO', 'North America'),
('FR', 'France',        'EURO', 'Europe');

SELECT 'Schema created successfully! ✅' AS status


-- Better fix for staging tables
--Since staging is raw data, make it flexible:
-- increse length since eroor while storing data

ALTER TABLE staging.stg_fda_shortages
ALTER COLUMN drug_name NVARCHAR(MAX);

ALTER TABLE staging.stg_fda_shortages
ALTER COLUMN brand_name NVARCHAR(MAX);

ALTER TABLE staging.stg_fda_shortages
ALTER COLUMN manufacturer NVARCHAR(MAX);

ALTER TABLE staging.stg_fda_shortages
ALTER COLUMN status NVARCHAR(MAX);

ALTER TABLE staging.stg_fda_shortages
ALTER COLUMN presentation NVARCHAR(MAX);

EXEC sp_help 'staging.stg_fda_shortages';

--Verify data in SSMS: expand pharma_db → staging → stg_fda_shortages → right-click → Select Top 1000 Rows
SELECT TOP (100) [id]
      ,[source_id]
      ,[drug_name]
      ,[brand_name]
      ,[manufacturer]
      ,[status]
      ,[reason]
      ,[presentation]
      ,[shortage_start]
      ,[shortage_end]
      ,[source]
      ,[raw_json]
      ,[ingested_at]
  FROM [pharma_db].[staging].[stg_fda_shortages]

  sp_help 'core.fact_shortage'

 -- to increace lrnght of presenation
ALTER TABLE core.fact_shortage
ALTER COLUMN presentation NVARCHAR(MAX);

--Also check reason_detail because FDA shortage reasons can be long too:
ALTER TABLE core.fact_shortage
ALTER COLUMN reason_detail NVARCHAR(MAX);

ALTER TABLE staging.stg_fda_shortages
ADD therapeutic_category NVARCHAR(MAX);


SELECT TOP 20
    d.generic_name       AS drug_name,
    m.company_name       AS manufacturer,
    f.status,
    f.shortage_start_date,
    f.shortage_end_date,
    r.country_name       AS region
FROM core.fact_shortage f
JOIN core.dim_drug d         ON d.drug_id = f.drug_id
JOIN core.dim_manufacturer m ON m.manufacturer_id = f.manufacturer_id
JOIN core.dim_region r       ON r.region_id = f.region_id
WHERE f.status = 'ACTIVE'
ORDER BY f.shortage_start_date DESC;

SELECT status, COUNT(*) cnt
FROM core.fact_shortage
GROUP BY status;

SELECT TOP 10 generic_name, risk_score, criticality_tier FROM core.dim_drug ORDER BY risk_score DESC

SELECT TOP 20
    shortage_start,
    shortage_end
FROM staging.stg_fda_shortages;

SELECT TOP 20
    shortage_start_date,
    shortage_end_date,
    status
FROM core.fact_shortage;

SELECT COUNT(*)
FROM core.fact_shortage
WHERE shortage_start_date IS NOT NULL;
TRUNCATE TABLE core.fact_shortage;

SELECT COUNT(*) FROM core.fact_shortage;

SELECT COUNT(shortage_start_date)
FROM core.fact_shortage;

SELECT TOP 10 shortage_start_date
FROM core.fact_shortage;