/**
 * ========================================================================
 *   CEYLON GOLD RATE - FRONTEND LOGIC & REAL-TIME API CONNECTOR
 *   Handles responsive dashboards, interactive cost calculators,
 *   FAQ accordions, persistent styling, and direct backend API integration
 *   for scraping live prices.
 * ========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State Management ---
    let goldRates = {
        24: 48150, // Fallback Defaults in LKR per Gram
        22: 44150,
        21: 42140,
        18: 36112.5
    };

    let yesterdayRates = {
        24: 48090,
        22: 44080,
        21: 42080,
        18: 36067.5
    };

    // Store actual scraped history
    let realHistoryData = null;

    let activeDisplayUnit = 'gram'; // 'gram' or 'sovereign'
    let activeChartPeriod = '7d';   // '7d' or '30d' or '1y'
    let historyChart = null;

    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const lastUpdatedText = document.getElementById('last-updated-text');
    const connectionStatus = document.getElementById('connection-status');
    
    // Spotlight Elements
    const sovPrice22k = document.getElementById('sov-price-22k');
    const gramPrice22k = document.getElementById('gram-price-22k');
    const pct22k = document.getElementById('pct-22k');
    const trend22k = document.getElementById('trend-22k');
    const prevSov22k = document.getElementById('prev-sov-22k');
    const diffSov22k = document.getElementById('diff-sov-22k');

    const sovPrice24k = document.getElementById('sov-price-24k');
    const gramPrice24k = document.getElementById('gram-price-24k');
    const pct24k = document.getElementById('pct-24k');
    const trend24k = document.getElementById('trend-24k');
    const prevSov24k = document.getElementById('prev-sov-24k');
    const diffSov24k = document.getElementById('diff-sov-24k');

    // Comprehensive Pricing Tabs
    const toggleGramBtn = document.getElementById('toggle-gram');
    const toggleSovereignBtn = document.getElementById('toggle-sovereign');
    
    // Calculator Elements
    const calcWeight = document.getElementById('calc-weight');
    const calcUnit = document.getElementById('calc-unit');
    const calcKarat = document.getElementById('calc-karat');
    const calcCharges = document.getElementById('calc-charges');
    const outBasePrice = document.getElementById('out-base-price');
    const outChargePct = document.getElementById('out-charge-pct');
    const outChargeCost = document.getElementById('out-charge-cost');
    const outTotalPrice = document.getElementById('out-total-price');
    const weightUnitLabel = document.getElementById('weight-unit-label');

    // Chart Filter Tabs
    const chart7dBtn = document.getElementById('chart-7d');
    const chart30dBtn = document.getElementById('chart-30d');
    const chart1yBtn = document.getElementById('chart-1y');

    // --- Helper Functions ---
    const formatLKR = (val) => {
        return 'Rs. ' + Math.round(val).toLocaleString('en-US');
    };

    const formatPercent = (val) => {
        const sign = val >= 0 ? '+' : '';
        return `${sign}${val.toFixed(2)}%`;
    };

    const getGramsFromWeight = (weight, unit) => {
        return unit === 'sovereign' ? weight * 8 : weight;
    };

    // --- Dynamic UI Rendering ---
    const updateDashboardPrices = () => {
        // 22K Sovereign Calculation
        const priceGram22 = goldRates[22];
        const priceSov22 = priceGram22 * 8;
        const prevSov22 = yesterdayRates[22] * 8;
        const diff22 = priceSov22 - prevSov22;
        const pctDiff22 = (diff22 / prevSov22) * 100;

        sovPrice22k.textContent = formatLKR(priceSov22);
        gramPrice22k.textContent = `${formatLKR(priceGram22)} per gram`;
        prevSov22k.textContent = formatLKR(prevSov22);
        diffSov22k.textContent = `${diff22 >= 0 ? '+' : ''}${formatLKR(diff22)}`;
        pct22k.textContent = formatPercent(pctDiff22);

        // Adjust trend badges
        if (diff22 >= 0) {
            trend22k.className = 'trend-badge up';
            trend22k.innerHTML = `<i class="fa-solid fa-caret-up"></i> <span class="trend-percent" id="pct-22k">${formatPercent(pctDiff22)}</span>`;
        } else {
            trend22k.className = 'trend-badge down';
            trend22k.innerHTML = `<i class="fa-solid fa-caret-down"></i> <span class="trend-percent" id="pct-22k">${formatPercent(pctDiff22)}</span>`;
        }

        // 24K Sovereign Calculation
        const priceGram24 = goldRates[24];
        const priceSov24 = priceGram24 * 8;
        const prevSov24 = yesterdayRates[24] * 8;
        const diff24 = priceSov24 - prevSov24;
        const pctDiff24 = (diff24 / prevSov24) * 100;

        sovPrice24k.textContent = formatLKR(priceSov24);
        gramPrice24k.textContent = `${formatLKR(priceGram24)} per gram`;
        prevSov24k.textContent = formatLKR(prevSov24);
        diffSov24k.textContent = `${diff24 >= 0 ? '+' : ''}${formatLKR(diff24)}`;
        pct24k.textContent = formatPercent(pctDiff24);

        if (diff24 >= 0) {
            trend24k.className = 'trend-badge up';
            trend24k.innerHTML = `<i class="fa-solid fa-caret-up"></i> <span class="trend-percent" id="pct-24k">${formatPercent(pctDiff24)}</span>`;
        } else {
            trend24k.className = 'trend-badge down';
            trend24k.innerHTML = `<i class="fa-solid fa-caret-down"></i> <span class="trend-percent" id="pct-24k">${formatPercent(pctDiff24)}</span>`;
        }

        // Update grid
        updateComprehensiveGrid();
    };

    const updateComprehensiveGrid = () => {
        const karats = [24, 22, 21, 18];
        const multiplier = activeDisplayUnit === 'sovereign' ? 8 : 1;
        const labelText = activeDisplayUnit === 'sovereign' ? 'Per Sovereign' : 'Per Gram';

        karats.forEach(k => {
            const price = goldRates[k] * multiplier;
            document.getElementById(`grid-price-${k}k`).textContent = formatLKR(price);
            document.getElementById(`grid-label-${k}k`).textContent = labelText;
        });
    };

    // --- Interactive Gold Calculator ---
    const runCalculator = () => {
        const weight = parseFloat(calcWeight.value) || 0;
        const unit = calcUnit.value;
        const karat = parseInt(calcKarat.value);
        const chargesPct = parseFloat(calcCharges.value) || 0;

        const grams = getGramsFromWeight(weight, unit);
        const ratePerGram = goldRates[karat];
        
        const baseGoldCost = grams * ratePerGram;
        const makingChargesCost = baseGoldCost * (chargesPct / 100);
        const totalEstimatedCost = baseGoldCost + makingChargesCost;

        outBasePrice.textContent = formatLKR(baseGoldCost);
        outChargePct.textContent = chargesPct;
        outChargeCost.textContent = formatLKR(makingChargesCost);
        outTotalPrice.textContent = formatLKR(totalEstimatedCost);
    };

    // Calculator event listeners
    [calcWeight, calcCharges].forEach(el => {
        el.addEventListener('input', runCalculator);
    });

    [calcUnit, calcKarat].forEach(el => {
        el.addEventListener('change', () => {
            weightUnitLabel.textContent = calcUnit.value === 'sovereign' ? 'sov' : 'g';
            runCalculator();
        });
    });

    // --- Market Tiers Unit Switching ---
    toggleGramBtn.addEventListener('click', () => {
        activeDisplayUnit = 'gram';
        toggleGramBtn.classList.add('active');
        toggleGramBtn.setAttribute('aria-selected', 'true');
        toggleSovereignBtn.classList.remove('active');
        toggleSovereignBtn.setAttribute('aria-selected', 'false');
        updateComprehensiveGrid();
    });

    toggleSovereignBtn.addEventListener('click', () => {
        activeDisplayUnit = 'sovereign';
        toggleSovereignBtn.classList.add('active');
        toggleSovereignBtn.setAttribute('aria-selected', 'true');
        toggleGramBtn.classList.remove('active');
        toggleGramBtn.setAttribute('aria-selected', 'false');
        updateComprehensiveGrid();
    });

    // --- Theme Management (Persistent Dark/Light) ---
    const getTheme = () => {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ceylon-gold-theme', theme);
        if (historyChart) {
            updateChartThemeConfig(theme);
        }
    };

    // Initialize Theme
    const savedTheme = localStorage.getItem('ceylon-gold-theme') || 'dark';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });

    // --- FAQ Accordion Logic ---
    const faqButtons = document.querySelectorAll('.faq-question-btn');
    faqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const faqItem = btn.parentElement;
            const isOpen = faqItem.classList.contains('active');
            
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                faqItem.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // --- Dynamic / Scraped Historical Data Mapper ---
    const getHistoricalData = (period, karat) => {
        let labels = [];
        let data = [];
        const today = new Date();

        // If we have actual real scraped history from our backend scraper
        if (realHistoryData && realHistoryData[karat] && realHistoryData.dates) {
            const rawDates = realHistoryData.dates;
            const rawPrices = realHistoryData[karat];
            
            if (period === '7d') {
                // Slice last 7 business days and reverse so they appear chronological (past -> present)
                labels = rawDates.slice(0, 7).reverse().map(d => formatDateLabel(d));
                data = rawPrices.slice(0, 7).reverse();
            } else if (period === '30d') {
                // Slice 30 entries and reverse
                labels = rawDates.slice(0, 20).reverse().map(d => formatDateLabel(d));
                data = rawPrices.slice(0, 20).reverse();
            } else if (period === '1y') {
                // Show full available history (50 records)
                labels = rawDates.slice(0, 50).reverse().map(d => formatDateLabel(d, true));
                data = rawPrices.slice(0, 50).reverse();
            }
            return { labels, data };
        }

        // Simulative fallback generator (if backend scraping API is offline)
        const currentPrice = goldRates[karat];
        if (period === '7d') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
            data = [currentPrice - 350, currentPrice - 100, currentPrice - 250, currentPrice - 30, currentPrice - 150, currentPrice - 58, currentPrice];
        } else if (period === '30d') {
            for (let i = 29; i >= 0; i -= 3) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
            let base = currentPrice - 980;
            for (let i = 0; i < 10; i++) {
                base += (Math.random() * 400 - 150);
                if (i === 9) base = currentPrice;
                data.push(Math.round(base));
            }
        } else if (period === '1y') {
            labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
            data = [currentPrice - 5100, currentPrice - 4700, currentPrice - 4200, currentPrice - 4500, currentPrice - 3800, currentPrice - 3200, currentPrice - 3400, currentPrice - 2600, currentPrice - 2100, currentPrice - 1200, currentPrice - 600, currentPrice];
        }

        return { labels, data };
    };

    // Standardizer for date labels (convert YYYY-MM-DD to "May 29")
    const formatDateLabel = (dateStr, includeYear = false) => {
        try {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return dateStr;
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: includeYear ? '2-digit' : undefined
            });
        } catch(e) {
            return dateStr;
        }
    };

    // --- Chart.js Rendering & Adaptations ---
    const updateChartThemeConfig = (theme) => {
        if (!historyChart) return;
        const isDark = theme === 'dark';
        const textColor = isDark ? '#9ca3af' : '#4b5563';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        historyChart.options.scales.x.ticks.color = textColor;
        historyChart.options.scales.y.ticks.color = textColor;
        historyChart.options.scales.x.grid.color = gridColor;
        historyChart.options.scales.y.grid.color = gridColor;
        historyChart.update();
    };

    const renderChart = () => {
        const ctx = document.getElementById('goldHistoryChart').getContext('2d');
        const activeKarat = parseInt(calcKarat.value);
        const { labels, data } = getHistoricalData(activeChartPeriod, activeKarat);

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(229, 184, 59, 0.35)');
        gradient.addColorStop(1, 'rgba(229, 184, 59, 0.0)');

        const theme = getTheme();
        const isDark = theme === 'dark';
        const textColor = isDark ? '#9ca3af' : '#4b5563';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        const chartConfig = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${activeKarat}K Gold Price (LKR/g)`,
                    data: data,
                    borderColor: '#e5b83b',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#e5b83b',
                    pointBorderColor: isDark ? '#11141a' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#11141a' : '#ffffff',
                        titleColor: '#e5b83b',
                        bodyColor: isDark ? '#f3f4f6' : '#111827',
                        borderColor: 'rgba(229, 184, 59, 0.4)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Price: Rs. ${context.parsed.y.toLocaleString('en-US')} / g`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Inter', size: 10 }
                        }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Inter', size: 10 },
                            callback: function(value) {
                                return 'Rs.' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        };

        if (historyChart) {
            historyChart.destroy();
        }
        historyChart = new Chart(ctx, chartConfig);
    };

    // Setup chart period click listeners
    const handlePeriodChange = (btn, period) => {
        [chart7dBtn, chart30dBtn, chart1yBtn].forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        activeChartPeriod = period;
        renderChart();
    };

    chart7dBtn.addEventListener('click', () => handlePeriodChange(chart7dBtn, '7d'));
    chart30dBtn.addEventListener('click', () => handlePeriodChange(chart30dBtn, '30d'));
    chart1yBtn.addEventListener('click', () => handlePeriodChange(chart1yBtn, '1y'));

    calcKarat.addEventListener('change', renderChart);

    // --- Backend API rates integration ---
    const loadRealRatesFromAPI = (isInitial = false) => {
        if (refreshBtn.classList.contains('loading') && !isInitial) return;

        // Visual loading trigger
        refreshBtn.classList.add('loading');
        refreshBtn.querySelector('i').className = 'fa-solid fa-arrows-rotate fa-spin';
        lastUpdatedText.textContent = 'Fetching current Ceylon Gold indexes...';
        
        // Show status feedback
        connectionStatus.className = 'ticker-status';
        connectionStatus.innerHTML = '<span class="pulse-dot" style="background-color: var(--warning); box-shadow: 0 0 8px var(--warning);"></span> <span>Connecting...</span>';

        const fetchUrl = isInitial ? 'api.php?_=' + Date.now() : 'api.php?force=true&_=' + Date.now();
        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) throw new Error('API server HTTP error ' + response.status);
                return response.json();
            })
            .then(data => {
                if (data && data.rates) {
                    // Update state variables with scraped prices
                    Object.keys(goldRates).forEach(k => {
                        if (data.rates[k]) {
                            goldRates[k] = data.rates[k];
                        }
                    });
                    
                    Object.keys(yesterdayRates).forEach(k => {
                        if (data.yesterday && data.yesterday[k]) {
                            yesterdayRates[k] = data.yesterday[k];
                        }
                    });

                    // Store historical vectors
                    if (data.history) {
                        realHistoryData = data.history;
                    }

                    // Update UI Prices
                    updateDashboardPrices();
                    runCalculator();
                    renderChart();

                    // Status success display
                    connectionStatus.className = 'ticker-status';
                    connectionStatus.innerHTML = '<span class="pulse-dot"></span> <span>Live Market Feed</span>';
                    
                    // Show parsed timestamp
                    lastUpdatedText.textContent = `Last updated: ${data.last_updated} ${data.cached ? '(Cached)' : ''}`;
                } else {
                    throw new Error('API returned malformed data');
                }
            })
            .catch(error => {
                console.warn('API fetch failed, falling back to simulated data: ', error);
                
                // Keep default simulated engine active on local offline environments
                if (!isInitial) {
                    // Slight random fluctuation fallback
                    Object.keys(goldRates).forEach(k => {
                        const fluctuationFactor = 1 + ((Math.random() * 0.45 - 0.15) / 100);
                        yesterdayRates[k] = goldRates[k];
                        goldRates[k] = Math.round(goldRates[k] * fluctuationFactor * 100) / 100;
                    });
                    updateDashboardPrices();
                    runCalculator();
                    renderChart();
                }

                // Show status feedback warning
                connectionStatus.className = 'ticker-status';
                connectionStatus.innerHTML = '<span class="pulse-dot" style="background-color: var(--danger); box-shadow: 0 0 8px var(--danger);"></span> <span>Demo Feed (Offline)</span>';
                
                const now = new Date();
                lastUpdatedText.textContent = `Last updated: Offline fallback at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
            })
            .finally(() => {
                // Remove loading indicators
                refreshBtn.classList.remove('loading');
                refreshBtn.querySelector('i').className = 'fa-solid fa-arrows-rotate';
            });
    };

    // Hook refresh click to load real rates
    refreshBtn.addEventListener('click', () => loadRealRatesFromAPI(false));

    // --- Initial Boot Initialization ---
    // Perform initial boot with API fetch
    loadRealRatesFromAPI(true);
});
