// Global chart instance
let cryptoChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Crypto Tracker Frontend Loaded");
    updatePrices();
    setInterval(updatePrices, 10000);
    selectCoin("bitcoin"); // default
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

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(0, 200, 255, 0.6)");
    gradient.addColorStop(1, "rgba(0, 100, 200, 0.1)");

    cryptoChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: `${coinName.toUpperCase()} Price (USD)`,
                data: prices,
                borderColor: color || "rgba(0, 200, 255, 1)",
                backgroundColor: gradient,
                fill: true,
                tension: 0.3,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `Price: $${ctx.formattedValue}`
                    }
                },
                legend: {
                    labels: { color: "#333", font: { size: 14 } }
                }
            },
            scales: {
                x: { ticks: { color: "#555" } },
                y: { ticks: { color: "#555" } }
            }
        }
    });
}

// --- Candlestick Renderer ---
function renderCandlestickChart(data) {
    const ctx = document.getElementById("cryptoChart").getContext("2d");
    if (cryptoChartInstance) cryptoChartInstance.destroy();

    cryptoChartInstance = new Chart(ctx, {
        type: "candlestick",
        data: { datasets: [{ label: "OHLC", data }] },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const o = ctx.raw;
                            return [
                                `Opened: $${o.o}`,
                                `High: $${o.h}`,
                                `Low: $${o.l}`,
                                `Closed: $${o.c}`,
                                o.c > o.o ? "Price went UP ✅" : "Price went DOWN ❌"
                            ];
                        }
                    }
                }
            }
        }
    });
}

// --- Volume + Market Cap Renderer ---
function renderChartWithVolume(data, volume, marketCap) {
    const ctx = document.getElementById("cryptoChart").getContext("2d");
    if (cryptoChartInstance) cryptoChartInstance.destroy();

    cryptoChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.timestamps,
            datasets: [
                { label: "Price", data: data.prices, borderColor: "blue", yAxisID: "y" },
                { label: "Volume", data: volume, type: "bar", backgroundColor: "rgba(0,200,0,0.3)", yAxisID: "y1" },
                { label: "Market Cap", data: marketCap, borderColor: "orange", borderDash: [5,5], yAxisID: "y" }
            ]
        },
        options: {
            scales: {
                y: { position: "left" },
                y1: { position: "right", grid: { drawOnChartArea: false } }
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
document.getElementById("lineChartBtn").addEventListener("click", () => {
    const coin = document.getElementById("coinSelector").value;
    loadChartData(coin, "7d", "line");
});

document.getElementById("candlestickChartBtn").addEventListener("click", async () => {
    const coin = document.getElementById("coinSelector").value;
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=7`);
    const json = await res.json();
    const ohlcData = json.map(p => ({ t: p[0], o: p[1], h: p[2], l: p[3], c: p[4] }));
    renderCandlestickChart(ohlcData);
});

document.getElementById("volumeChartBtn").addEventListener("click", () => {
    const coin = document.getElementById("coinSelector").value;
    loadChartData(coin, "7d", "volume");
});