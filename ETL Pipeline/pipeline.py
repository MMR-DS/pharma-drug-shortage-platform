# etl/pipeline.py
# Run from Command Prompt: python etl/pipeline.py
 
import requests
import pandas as pd
import json
import hashlib
import logging
from sqlalchemy import create_engine, text
from datetime import datetime
 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(r"C:\Users\Mayur Rane\Desktop\stucture\ETL\etl_log.txt"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)
 
# ✅ YOUR exact connection string from 01_fda_collector.ipynb
DB_URL = (
    "mssql+pyodbc://@LAPTOP-K44AI2HU\\SQLEXPRESS/pharma_db"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    "&trusted_connection=yes"
)
 
# ✅ YOUR exact fetch function — limit=None to fetch ALL records
def fetch_fda(limit=None):
    url = "https://api.fda.gov/drug/shortages.json"   # your URL (with the 's')
    all_records, skip = [], 0
    while True:
        try:
            resp = requests.get(url, params={"limit": 100, "skip": skip}, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                break
            all_records.extend(results)
            total = data.get("meta", {}).get("results", {}).get("total", 0)
            log.info(f"FDA: {len(all_records)}/{total}")
            if limit is not None and len(all_records) >= min(total, limit):
                break
            skip += 100
        except Exception as e:
            log.error(f"FDA fetch error: {e}")
            break
    return all_records
 
# ✅ YOUR exact normalize function — uses r.get("status") not r.get("shortage_status")
def normalize(records):
    rows = []
    for r in records:
        rows.append({
            "source_id":      r.get("id", ""),
            "drug_name":      r.get("generic_name", "").strip().upper() if r.get("generic_name") else "",
            "brand_name":     r.get("proprietary_name", ""),
            "manufacturer":   r.get("company_name", ""),
            "status":         r.get("status", "UNKNOWN").upper(),   # your fix
            "reason":         r.get("reason_for_shortage", ""),
            "presentation":   r.get("presentation", ""),
            "shortage_start": r.get("shortage_start_date", ""),
            "shortage_end":   r.get("shortage_end_date", ""),
            "source":         "FDA",
            "raw_json":       json.dumps(r),
            "ingested_at":    datetime.utcnow(),
        })
    return pd.DataFrame(rows)
 
# ✅ YOUR approach — TRUNCATE staging first, then load fresh (cleaner than append)
def load_to_staging(df, engine):
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE staging.stg_fda_shortages"))
    df.to_sql("stg_fda_shortages", engine, schema="staging",
              if_exists="append", index=False, chunksize=100)
    log.info(f"Staging: {len(df)} records saved")
 
def load_dimensions(df, engine):
    # Drugs
    drugs = df[["drug_name"]].drop_duplicates()
    drugs = drugs[drugs["drug_name"] != ""].copy()
    drugs.columns = ["generic_name"]
    drugs["normalized_name"] = drugs["generic_name"]
    drugs["therapeutic_category"] = "UNCATEGORIZED"
    drugs["is_essential"] = False
    drugs["criticality_tier"] = "MEDIUM"
    drugs["risk_score"] = 0.0
    existing_drugs = pd.read_sql("SELECT normalized_name FROM core.dim_drug", engine)["normalized_name"].tolist()
    new_drugs = drugs[~drugs["normalized_name"].isin(existing_drugs)]
    if not new_drugs.empty:
        new_drugs.to_sql("dim_drug", engine, schema="core", if_exists="append", index=False)
        log.info(f"Drugs: {len(new_drugs)} new added")
    else:
        log.info("Drugs: no new drugs to add")
 
    # Manufacturers
    mfrs = df[["manufacturer"]].drop_duplicates()
    mfrs = mfrs[mfrs["manufacturer"] != ""].copy()
    mfrs.columns = ["company_name"]
    mfrs["country_of_origin"] = "US"
    mfrs["is_sole_supplier"] = False
    existing_mfrs = pd.read_sql("SELECT company_name FROM core.dim_manufacturer", engine)["company_name"].tolist()
    new_mfrs = mfrs[~mfrs["company_name"].isin(existing_mfrs)]
    if not new_mfrs.empty:
        new_mfrs.to_sql("dim_manufacturer", engine, schema="core", if_exists="append", index=False)
        log.info(f"Manufacturers: {len(new_mfrs)} new added")
    else:
        log.info("Manufacturers: no new manufacturers to add")
 
# ✅ YOUR exact status mapping from 02_load_star_schema.ipynb
def load_facts(df, engine):
    drug_map = pd.read_sql("SELECT drug_id, normalized_name FROM core.dim_drug", engine)
    drug_map = dict(zip(drug_map["normalized_name"], drug_map["drug_id"]))
 
    mfr_map = pd.read_sql("SELECT manufacturer_id, company_name FROM core.dim_manufacturer", engine)
    mfr_map = dict(zip(mfr_map["company_name"], mfr_map["manufacturer_id"]))
 
    region_us = pd.read_sql("SELECT region_id FROM core.dim_region WHERE country_code='US'", engine)["region_id"][0]
    source_fda = pd.read_sql("SELECT source_id FROM core.dim_source WHERE source_name='FDA'", engine)["source_id"][0]
    existing = pd.read_sql("SELECT record_hash FROM core.fact_shortage", engine)["record_hash"].tolist()
 
    rows = []
    for _, r in df.iterrows():
        drug_key = str(r["drug_name"]).upper().strip()
        mfr_key = str(r["manufacturer"])
        h = hashlib.sha256(f"{drug_key}|{mfr_key}|{r['shortage_start']}|FDA".encode()).hexdigest()
        if h in existing:
            continue
 
        # ✅ YOUR status mapping
        fda_status = str(r["status"]).upper()
        if fda_status == "CURRENT":
            status = "ACTIVE"
        elif fda_status == "TO BE DISCONTINUED":
            status = "DISCONTINUED"
        elif fda_status == "RESOLVED":
            status = "RESOLVED"
        else:
            status = "UNKNOWN"
 
        rows.append({
            "drug_id":             drug_map.get(drug_key),
            "manufacturer_id":     mfr_map.get(mfr_key),
            "region_id":           region_us,
            "source_id":           source_fda,
            "source_record_id":    r["source_id"],
            "status":              status,
            "reason_detail":       r["reason"],
            "presentation":        r["presentation"],
            "shortage_start_date": pd.to_datetime(r["shortage_start"], errors="coerce"),
            "shortage_end_date":   pd.to_datetime(r["shortage_end"], errors="coerce"),
            "is_critical":         False,
            "is_resolved":         status == "RESOLVED",
            "record_hash":         h,
            "ingested_at":         datetime.now(),
        })
 
    if rows:
        new_df = pd.DataFrame(rows).dropna(subset=["drug_id"])
        new_df.to_sql("fact_shortage", engine, schema="core", if_exists="append", index=False)
        log.info(f"Facts: {len(new_df)} new records loaded")
    else:
        log.info("Facts: no new records")
 
def run():
    log.info("=" * 50)
    log.info("ETL PIPELINE STARTED")
    engine = create_engine(DB_URL)
    records = fetch_fda(limit=None)       # fetch ALL records like your notebook
    df = normalize(records)
    df = df.drop(columns=["json_len"], errors="ignore")   # your cleanup step
    load_to_staging(df, engine)
    load_dimensions(df, engine)
    load_facts(df, engine)
    log.info("ETL PIPELINE COMPLETE ✅")
    log.info("=" * 50)
 
if __name__ == "__main__":
    run()