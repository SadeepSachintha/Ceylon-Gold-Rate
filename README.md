---
title: Ceylon Gold Rate
emoji: 🪙
colorFrom: gold
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
---

# 🪙 Ceylon Gold Price Tracker (Sri Lanka)

A premium, responsive, real-time web application to check and estimate 22K, 24K, 21K, and 18K gold prices in Sri Lanka. It features a sophisticated glassmorphic design, persistent Dark/Light theme toggles, interactive historical trend lines, an intelligent jewelry cost calculator, and a server-side web scraper with automated caching.

Designed for high-performance and seamless hosting locally under XAMPP or in production as a **Docker Space on Hugging Face**.

---

## 🚀 Key Features

*   **Real-Time Scraper Backend (`api.php`)**: Dynamically parses the latest retail gold indexes in Sri Lanka using server-side cURL requests.
*   **4-Hour Caching Layer (`rates_cache.json`)**: Caches scraped JSON datasets to optimize site performance, reduce server loading times (<15ms), and prevent IP address rate limits. Includes automatic expired-cache fallbacks if the internet or source site goes offline.
*   **Intelligent Value Calculator**: Instantly computes raw base gold prices by converting between Grams and Sovereigns (1 sovereign = 8 grams) and Karats (24K, 22K, 21K, 18K). It allows buyers to input customizable making/wastage charges (0%–100%) to estimate the true retail cost.
*   **Dynamic Trend Charts**: Integrates Chart.js to map up to 50 days of real, parsed historical prices. Supports 7D, 30D, and 50D (1Y) period filters with neon gold gradients.
*   **Theme Adaptation Engine**: Seamlessly shifts typography gridlines, card backgrounds, scrollbars, and Chart.js coordinates when toggling between persistent Light and Dark modes.
*   **Sri Lankan Buying Guide**: An accessible, interactive accordion answering common questions about purchasing gold locally, hallmarks, and verifying purity.
*   **Hugging Face CI/CD Ready**: Includes a production `Dockerfile` configured to route container traffic through Hugging Face's port `7860` and a GitHub Actions deploy pipeline.

---

## 🛠️ Project Structure

```
Ceylon Gold Rate/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline to sync repository pushes to Hugging Face
├── index.html                # Semantic, SEO-optimized markup
├── style.css                 # Premium custom variables, layouts, animations, and typography
├── app.js                    # Client-side reactivity, conversions, calculators, and charts
├── api.php                   # cURL scraper parsing current and historical rates
├── Dockerfile                # Configures Apache, PHP-cURL, and port 7860 for Hugging Face
└── README.md                 # Project guide and documentation
```

---

## 💻 Local Installation (XAMPP)

1.  **Move the Files**: Copy the entire project directory into your XAMPP's document root folder:
    `C:\xampp\htdocs\Ceylon Gold Rate\` (or `D:\xampp\htdocs\Ceylon Gold Rate\`).
2.  **Start the Server**: Open the **XAMPP Control Panel** and click **Start** next to the **Apache** module.
3.  **Open in Browser**: Navigate to:  
    👉 **[http://localhost/Ceylon%20Gold%20Rate/](http://localhost/Ceylon%20Gold%20Rate/)**
4.  **Scrape Live Data**: Click **Refresh Market Rates** to trigger the cURL parser and load real-time prices instantly!

---

## 🐳 Hugging Face Spaces Deployment

Since the application requires a backend server-side scraper (`api.php`), you cannot deploy it as a static space. Instead, deploy it as a **Docker Space**:

1.  Log in to **Hugging Face** and click **Create new Space**.
2.  Set your Space name to `Ceylon-Gold-Rate`.
3.  Select **Docker** as the SDK (Important!), and select the **Blank** template.
4.  Upload the following files from your local workspace:
    *   `index.html`
    *   `style.css`
    *   `app.js`
    *   `api.php`
    *   `Dockerfile`
5.  Hugging Face will automatically compile the Docker container, spin up PHP 8.2-Apache, direct port mapping to `7860`, and host your dashboard live!

---

## 🔄 Automated CI/CD Setup (GitHub Actions)

You can sync pushes to your GitHub repository automatically to your Hugging Face Space using the pre-configured workflow:

1.  **Generate HF Token**:
    *   On Hugging Face, go to **Settings** -> **Access Tokens**.
    *   Generate a new token named `github-sync` with **Write** privileges. Copy it.
2.  **Add Secret to GitHub**:
    *   Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
    *   Set the name to `HF_TOKEN` and paste your Hugging Face token.
3.  **Confirm Target URL**:
    *   Confirm your repository path inside `.github/workflows/deploy.yml` is set correctly:
        `git remote add hf https://dwssp:$HF_TOKEN@huggingface.co/spaces/dwssp/Ceylon-Gold-Rate`
4.  **Push to GitHub**:
    *   Push your changes to GitHub (`main` or `master` branch) to trigger the Actions sync and deploy automatically!
