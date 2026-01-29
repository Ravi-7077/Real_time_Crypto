Chart.defaults.font.family = "'Inter', 'Segoe UI', system-ui, sans-serif";
Chart.defaults.color = "#6B7280"; // Tailwind gray-500
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = "#111827";
Chart.defaults.plugins.tooltip.titleColor = "#F9FAFB";
Chart.defaults.plugins.tooltip.bodyColor = "#E5E7EB";
Chart.defaults.plugins.tooltip.borderColor = "#374151";
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;

let cryptoChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Crypto Tracker Frontend Loaded");
    updatePrices();
    setInterval(updatePrices, 10000);
    selectCoin("bitcoin"); // default
});

// Attach UI listeners after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const timeSel = document.getElementById("timeSelector");
    const coinSel = document.getElementById("coinSelector");
    const lineBtn = document.getElementById("lineChartBtn");
    const volBtn = document.getElementById("volumeChartBtn");
    const setAlertBtn = document.getElementById("setAlertBtn");

    if (timeSel && coinSel) {
        timeSel.addEventListener("change", e => {
            const range = e.target.value;
            const coin = coinSel.value;
            loadChartData(coin, range);
        });
    }

    if (lineBtn) lineBtn.addEventListener("click", () => {
        const coin = document.getElementById("coinSelector").value;
        loadChartData(coin, "7", "line");
    });

    if (volBtn) volBtn.addEventListener("click", () => {
        const coin = document.getElementById("coinSelector").value;
        loadChartData(coin, "7", "volume");
    });

    if (setAlertBtn) setAlertBtn.addEventListener("click", setAlertPrice);
});

// --- Fetch Prices ---
async function updatePrices() {
    try {
        const response = await fetch("/api/prices");
        const { prices, alert, threshold_value } = await response.json();

        if (prices) {
            document.getElementById("price-bitcoin").innerText = `$${prices.bitcoin.usd}`;
            document.getElementById("price-ethereum").innerText = `$${prices.ethereum.usd}`;
            document.getElementById("price-dogecoin").innerText = `$${prices.dogecoin.usd}`;
        }

        if (alert) {
            showToast(`Bitcoin is below $${threshold_value}! Current: $${prices.bitcoin.usd}`);
        }
    } catch (err) {
        console.error("Network error:", err);
    }
}

// --- Toast Helper ---
function showToast(message) {
    const toastElement = document.getElementById("priceToast");
    toastElement.querySelector(".toast-body").innerText = message;
    new bootstrap.Toast(toastElement).show();
    new Audio("https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3").play();
}

// --- Coin Selection ---
async function selectCoin(coinId) {
    document.querySelector(".card-header h5").innerText = `Price Trend (${coinId.toUpperCase()} - Past Week)`;
    try {
        const res = await fetch(`/api/history/${coinId}`);
        const data = await res.json();
        if (data.prices) renderLineChart(data.prices, data.labels, data.color, coinId);
    } catch (err) {
        console.error("Error fetching history:", err);
    }
}

// --- Line Chart Renderer ---
function renderLineChart(prices, labels, color, coinName) {
    const ctx = document.getElementById("cryptoChart").getContext("2d");
    if (cryptoChartInstance) cryptoChartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(59,130,246,0.35)");
    gradient.addColorStop(1, "rgba(59,130,246,0)");

    cryptoChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                data: prices,
                borderColor: color || "#3B82F6",
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        },
        options: {
            interaction: { mode: "index", intersect: false },
            responsive: true,
            animation: { duration: 800 },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `$${Number(ctx.parsed.y).toLocaleString()}`
                    }
                },
                title: {
                    display: true,
                    text: `${coinName.toUpperCase()} Price`,
                    color: "#111827",
                    font: { size: 16, weight: "600" }
                }
            },
            scales: {
                x: {
                    type: "time",
                    grid: { display: false },
                    ticks: { maxTicksLimit: 6 }
                },
                y: {
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                        callback: v => `$${v.toLocaleString()}`
                    }
                }
            }
        }
    });
}

// Candlestick chart removed - requires additional library (chartjs-chart-financial)
// If needed in the future, install: https://github.com/chartjs/chartjs-chart-financial

// --- Volume + Market Cap Renderer ---
function renderChartWithVolume(data, volume, marketCap) {
    const ctx = document.getElementById("cryptoChart").getContext("2d");
    if (cryptoChartInstance) cryptoChartInstance.destroy();

    cryptoChartInstance = new Chart(ctx, {
        data: {
            labels: data.timestamps,
            datasets: [
                {
                    type: "line",
                    label: "Price",
                    data: data.prices,
                    borderColor: "#3B82F6",
                    yAxisID: "y",
                    tension: 0.35,
                    pointRadius: 0
                },
                {
                    type: "bar",
                    label: "Volume",
                    data: volume,
                    backgroundColor: "rgba(16,185,129,0.25)",
                    yAxisID: "y1"
                },
                {
                    type: "line",
                    label: "Market Cap",
                    data: marketCap,
                    borderColor: "#F59E0B",
                    borderDash: [6, 6],
                    yAxisID: "y"
                }
            ]
        },
        options: {
            interaction: { mode: "index", intersect: false },
            scales: {
                y: {
                    position: "left",
                    ticks: {
                        callback: v => `$${v.toLocaleString()}`
                    }
                },
                y1: {
                    position: "right",
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: v => v.toLocaleString()
                    }
                }
            }
        }
    });
}

// --- Historical Selector ---
document.getElementById("timeSelector").addEventListener("change", e => {
    const range = e.target.value;
    const coin = document.getElementById("coinSelector").value;
    loadChartData(coin, range);
});

async function loadChartData(coin, range, chartType="line") {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${range}`);
    const json = await res.json();

    const prices = json.prices.map(p => ({ x: new Date(p[0]), y: p[1] }));
    const volume = json.total_volumes.map(v => v[1]);
    const marketCap = json.market_caps.map(m => m[1]);

    if (chartType === "line") {
        renderLineChart(prices.map(p=>p.y), prices.map(p=>p.x), "rgba(0,200,255,1)", coin);
    } else if (chartType === "volume") {
        renderChartWithVolume({timestamps: prices.map(p=>p.x), prices: prices.map(p=>p.y)}, volume, marketCap);
    }
}

// Buttons wired in DOMContentLoaded above

// --- Set Alert (persist to backend) ---
async function setAlertPrice() {
    const input = document.getElementById("alert-input");
    if (!input) return;
    const price = Number(input.value);
    if (!price || price <= 0) {
        alert('Enter a valid price');
        return;
    }

    try {
        const res = await fetch('/api/set-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price })
        });
        const json = await res.json();
        if (res.ok) {
            showToast(`Alert set at $${price}`);
        } else {
            alert('Failed to set alert: ' + (json.error || res.statusText));
        }
    } catch (err) {
        console.error('Error setting alert:', err);
        alert('Network error');
    }
}