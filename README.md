# ⚡ HGT Spark Bot & Container Control Center

A high-throughput automated bot management dashboard, real-time Webex/Spark API telemetry monitor, and container performance station built for **HACYBERGLOBAL LLC**.

![Node Version](https://img.shields.io/badge/node-v20%2B-blue.svg)
![React](https://img.shields.io/badge/react-v19.0-cyan.svg)
![Vite](https://img.shields.io/badge/vite-v6.0-purple.svg)
![AWS App Runner](https://img.shields.io/badge/AWS-App%20Runner-orange.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Proxied-amber.svg)

---

## 📖 Overview

**HGT Spark Bot** is a full-stack telemetry and automated dispatch platform designed for real-time Webex/Spark API heartbeat tracking, driver payout routing, multi-bot Telegram lead generation, and container resource diagnostics. It features a custom Express server bundled with ESBuild for standalone production execution on container runtimes like **AWS App Runner**, **Google Cloud Run**, and **Cloudflare Workers**.

---

## 🔥 Key Features

### 🖥️ 1. System Health Snapshot Widget
- **Real-time CPU Monitoring**: Live multi-core CPU load gauges, core distribution breakdown, and historical load sparkline visualizers.
- **V8 RAM & Cache Management**: Heap memory allocation, Resident Set Size (RSS) counters, and an interactive **Flush RAM Cache** V8 garbage collector trigger.
- **Bot Worker Thread Registry**: Live thread activity monitoring tracking active worker threads (Spark Order Dispatcher, Webex Heartbeat, Telegram Listener, Telemetry Streamer, etc.) with latency profiling.
- **Stress Load Simulation**: One-click CPU load simulator to test container resilience under burst traffic scenarios.

### 📡 2. Webex / Spark Connectivity & Telemetry
- **Spark Latency Monitor**: Real-time heartbeat tracking for Cisco Webex / Spark API endpoints (`api.ciscospark.com`).
- **Ping Baseline & Congestion Alerts**: 24-hour rolling latency baseline comparison (`Compare Latency ON/OFF`) and automated audio/visual congestion warnings for latency spikes.
- **RTT Histogram**: Latency distribution binning (0-15ms, 15-30ms, 30-60ms, >60ms) for network diagnostics.

### 🛡️ 3. Cloudflare Telemetry Shield
- **Orange Cloud Proxy Audit**: Automatic detection and resolution of backend container IP exposure.
- **DNS Record Proxying**: Automated CNAME routing via Cloudflare Client v4 API.
- **Cloudflare KV Log Storage**: Direct telemetry log payload upload to Cloudflare Workers KV.

### 💳 4. Payments, Drivers & Automation
- **Stripe & PayPal Connect**: Automated merchant onboarding, express checkout links, and receipt delivery logs.
- **Telegram Sandbox Dispatcher**: Lead outreach automation, payment instruction push, and transaction receipt validation.
- **Driver Payout Wallet**: Multi-channel payout wallet supporting Zelle (`zelle@hacyberglobal.linkpc.net`), CashApp, Venmo, and Direct Bank Deposits.
- **Geofence Polygon Evaluator**: Real-time driver positioning map with geofence trigger detection.

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v20.0 or higher
- **npm**: v10.0 or higher
- **Docker** *(Optional, for local container testing)*

### 1. Clone the Repository
```bash
git clone https://github.com/hacyber-global/hgt-spark-bot.git
cd hgt-spark-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The application will launch locally at `http://localhost:3000`.

### 4. Build and Run Production Locally
```bash
# Compile Vite frontend & ESBuild server bundle
npm run build

# Start standalone Node CommonJS production server
npm run start
```

---

## 🔑 Environment Variables

Copy `.env.example` to create your local `.env` configuration:

```bash
cp .env.example .env
```

### Required & Optional Variables

| Environment Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Container network binding port | `3000` *(Hardcoded for ingress)* |
| `NODE_ENV` | Runtime environment state | `production` or `development` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token for dispatch actions | `8737167779:AAE2...` |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for alert notifications | `5642832782` |
| `CLOUDFLARE_API_TOKEN` | Bearer token for Cloudflare Client v4 API | `cf_pat_...` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account identifier | `a1b2c3d4...` |
| `CLOUDFLARE_ZONE_ID` | Cloudflare DNS Zone ID for custom domain | `0123456789abcdef...` |
| `CLOUDFLARE_NAMESPACE_ID` | Cloudflare KV Namespace ID for logs | `kv_namespace_id...` |
| `STRIPE_SECRET_KEY` | Stripe secret key for payment processing | `sk_live_...` |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key for client checkout | `pk_live_...` |
| `GEMINI_API_KEY` | Google Gemini API key for intelligent log parsing | `AIzaSy...` |

---

## ☁️ Deployment Instructions for AWS App Runner

**AWS App Runner** provides fully managed containerized deployment with automatic scaling, TLS termination, and custom domain CNAME routing.

### Option A: Deployment via AWS ECR (Container Image)

#### Step 1: Create AWS ECR Repository & Authenticate
```bash
# 1. Create an ECR Repository
aws ecr create-repository --repository-name hgt-spark-bot --region us-east-1

# 2. Authenticate Docker CLI to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2: Build & Push Docker Container Image
```bash
# 1. Build Docker image locally
docker build -t hgt-spark-bot:latest .

# 2. Tag image for ECR
docker tag hgt-spark-bot:latest <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hgt-spark-bot:latest

# 3. Push container image to ECR
docker push <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hgt-spark-bot:latest
```

#### Step 3: Provision AWS App Runner Service
1. Open the **AWS App Runner Console** (`https://console.aws.amazon.com/apprunner`).
2. Click **Create an App Runner service**.
3. Under **Source**:
   - Select **Container registry** -> **Amazon ECR**.
   - Choose image: `<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hgt-spark-bot:latest`.
   - Deployment trigger: **Automatic** (re-deploys on image push).
4. Under **Configure service**:
   - **Service name**: `hgt-spark-bot-service`
   - **Virtual CPU & Memory**: `1 vCPU / 2 GB RAM` (or `0.5 vCPU / 1 GB RAM`)
   - **Port**: `3000`
   - **Environment variables**: Add `TELEGRAM_BOT_TOKEN`, `CLOUDFLARE_API_TOKEN`, `STRIPE_SECRET_KEY`, etc.
5. Under **Health Check**:
   - **Protocol**: `HTTP`
   - **Path**: `/api/health`
   - **Interval**: `10 seconds`
   - **Healthy threshold**: `2`
6. Click **Create & Deploy**.

---

### Option B: Deployment via GitHub Source Repository

1. In **AWS App Runner Console**, select **Source code repository**.
2. Connect your **GitHub Account** and select repository `hacyber-global/hgt-spark-bot` (Branch: `main`).
3. Configure build settings:
   - **Runtime**: `Node.js 20`
   - **Build command**: `npm ci && npm run build`
   - **Start command**: `node dist/server.cjs`
   - **Port**: `3000`
4. Deploy the service.

---

### 🌐 Custom Domain Binding on AWS App Runner (`hacyberglobal.linkpc.net`)

1. In the App Runner console, navigate to **Custom Domains** -> **Add domain**.
2. Enter domain: `hacyberglobal.linkpc.net`.
3. AWS App Runner will generate CNAME and Validation DNS records.
4. Add the provided CNAME records to your DNS provider (e.g. Cloudflare or No-IP / Dynamic DNS):
   - **CNAME**: `@` -> `apprunner-assigned-endpoint.awsapprunner.com`
   - **CNAME**: `telemetry` -> `apprunner-assigned-endpoint.awsapprunner.com`
5. Enable **Cloudflare Orange Cloud Proxy** to mask origin IPs and enforce SSL/TLS encryption.

---

## 🚀 Alternative Deployment Pathways

### Google Cloud Run
Run the included deployment script:
```bash
chmod +x deploy_cloud.sh
./deploy_cloud.sh
```

### Cloudflare Pages & Workers
```bash
npm run deploy:cloudflare
```

---

## 🛠️ Project Structure

```
hgt-spark-bot/
├── Dockerfile                  # Multi-stage Docker build for Node 22 + Vite
├── deploy_cloud.sh             # GCP Cloud Run auto-deploy script
├── package.json                # Dependencies, scripts, and build metadata
├── server.ts                   # Express server entry point & API route handlers
├── vite.config.ts              # Vite configuration & plugin setup
├── wrangler.toml               # Cloudflare Workers / Pages configuration
└── src/
    ├── App.tsx                 # Main application dashboard
    ├── components/
    │   ├── SystemHealthSnapshot.tsx  # Real-time CPU/RAM/Thread monitor
    │   ├── WebexConnectivityLog.tsx  # Webex/Spark API telemetry log & RTT chart
    │   ├── DashboardStats.tsx        # High-level metrics & status cards
    │   ├── CloudDeployment.tsx       # Deployment terminal & CNAME manager
    │   ├── TelegramBotSetup.tsx      # Telegram bot dispatch & lead outreach
    │   ├── DepositSetup.tsx          # Payment method & receipt generator
    │   ├── DriverWallet.tsx          # Driver payout & earnings management
    │   └── SparkLatencyChart.tsx     # Latency graph & heartbeat visualization
    └── lib/
        ├── audioManager.ts           # Web Audio API alert synthesizer
        ├── cloudflare.ts             # Cloudflare Client v4 API integration
        └── telegramBilling.ts        # Telegram billing & retry helper
```

---

## 📄 License

Proprietary Software — Developed for **HACYBERGLOBAL LLC**. All rights reserved.
