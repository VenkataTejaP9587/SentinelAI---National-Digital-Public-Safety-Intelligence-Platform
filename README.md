# 🛡️ SentinelAI – AI Digital Public Safety Intelligence Platform

> **Problem Statement: AI for Digital Public Safety**
> Proactive prevention of counterfeit currency, digital arrest scams, and organized fraud networks.

SentinelAI is a production-ready, enterprise-grade digital public safety intelligence platform. This repository contains the consolidated monolithic implementation designed to run **directly on your local host (WITHOUT Docker)**. 

---

## 📁 Consolidated Project Structure

* **`frontend/`**: Unified Next.js 16 + React 19 dashboard application (Citizens, Police, Banks, Telecom, Admin).
* **`backend/`**: Monolithic FastAPI backend.
* **`database/`**: Raw SQL schemas (`schema.sql`) and database seeding script (`seed_data.py`).
* **`uploads/`**: Storage folder for uploads (scam audio, currency photos).

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:
1. **Python 3.12+**
2. **Node.js 20+** and **npm**
3. **PostgreSQL 15+**
4. **Neo4j Desktop** (or Neo4j Community Server)

---

## 🚀 Step-by-Step Local Setup

### 1. PostgreSQL Database Configuration
1. Open your PostgreSQL console/admin client (e.g. pgAdmin or `psql`).
2. Create a new database named `kavach` and a database user named `kavach` with password `password`:
   ```sql
   CREATE USER kavach WITH PASSWORD 'password';
   CREATE DATABASE kavach OWNER kavach;
   GRANT ALL PRIVILEGES ON DATABASE kavach TO kavach;
   ```
3. Execute the schema tables:
   ```bash
   psql -U kavach -d kavach -f database/schema.sql
   ```
   *(Note: The schema is optimized for standard PostgreSQL datatypes. If PostGIS spatial queries are desired, ensure the PostGIS extension is installed on your local PostgreSQL engine).*

### 2. Neo4j Relationship Graph Configuration
1. Open **Neo4j Desktop** and create a local graph database.
2. Set the password of the database (e.g., to `password`).
3. Start the graph. Verify that the Bolt driver port `7687` is active.
4. *Resilience Feature*: If Neo4j is not running during your demonstration, SentinelAI automatically activates a **Fallback Mock Engine** so that the interactive network graph UI in the Police command center will still load and display sample fraud network rings without failing.

### 3. Backend Setup
1. Open your terminal in the project root directory.
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (Powershell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template file:
   ```bash
   cp .env.example .env
   ```
   *(Modify `.env` to match your local PostgreSQL and Neo4j login credentials if they differ).*
5. Seed the database with sample profiles, complaints, and spatial logs:
   ```bash
   npm run seed:db
   ```

### 4. Frontend Setup
1. Go into the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Return to the root folder:
   ```bash
   cd ..
   ```

---

## 💻 Running the Application

You can easily start the servers using the root-level npm scripts:

### Start Backend API Server
```bash
npm run dev:backend
```
* **API Documentation (Swagger)**: http://localhost:8000/docs
* **API Redoc**: http://localhost:8000/redoc

### Start Frontend UI Server
```bash
npm run dev:frontend
```
* **Unified Portal**: http://localhost:3000

---

## 🛡️ Role Credentials (For Demos)

You can authenticate on the platform using the following details (OTP verification code is simulated as **`123456`**):

| Role | Mobile Number | Purpose |
|------|---------------|---------|
| **Citizen** | `9876543210` | Fraud checkers, currency scanner, AI multilingual chatbot, file FIR |
| **Police Officer** | `8888888888` | Incident Command Center, interactive GNN fraud network, GIS hotspots, download PDF case brief |
| **Bank Officer** | `7777777777` | Mule account registries, freeze requests, high-risk bank transfers |
| **Telecom Officer** | `6666666666` | Sim clusters link, gateway spoof checking logs, metadata metrics |
| **Administrator** | `9999999999` | Health audit logs, system configurations, models serving logs |

---

## 🧬 Modular AI Architecture (Integration Ready)

SentinelAI's backend serves as a consolidated gateway orchestrating separate AI inference streams:
1. **`scam_detector.py`**: Integrates ASR transcriptions (Whisper) and toxic text classification (IndicBERT / RoBERTa) to isolate Digital Arrest tactics.
2. **`counterfeit_detector.py`**: Inspects note image structures via YOLOv11 and Vision Transformers (ViT) checking watermark and thread compliance.
3. **`fraud_graph.py`**: Maps network relations utilizing graph-based neural models (GraphSAGE / GAT) on Neo4j clusters.
4. **`geospatial.py`**: Traces district hazard densities and patrol suggestions.
5. **`predictive.py`**: Isolates abnormal bank wire transfers using anomaly-detection forest predictors.
