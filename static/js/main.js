// Global variable to hold the chart instance
let cryptoChartInstance = null; 

document.addEventListener("DOMContentLoaded", function () {
    console.log("Crypto Tracker Frontend Loaded");

    // 1. Start Price Updates
    updatePrices();
    setInterval(updatePrices, 10000); 

    // 2. Load Bitcoin by default
    selectCoin('bitcoin');
});

// --- Function 1: Fetch Real-Time Prices ---
async function updatePrices() {
    try {
        const response = await fetch('/api/prices');
        const data = await response.json();

        if (data.bitcoin) {
            document.getElementById("price-bitcoin").innerText = `$${data.bitcoin.usd}`;
            document.getElementById("price-ethereum").innerText = `$${data.ethereum.usd}`;
            document.getElementById("price-dogecoin").innerText = `$${data.dogecoin.usd}`;
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

// --- Function 2: Handle Coin Selection (Click) ---
async function selectCoin(coinId) {
    console.log("Selected coin:", coinId);
    
    // Highlight the selected card visually
    document.querySelectorAll('.coin-card').forEach(card => {
        card.classList.remove('border-primary', 'border-2'); // Remove highlight from all
    });
    // Add highlight to the clicked one (this logic finds the card based on the click event usually, 
    // but for simplicity here we just visually highlight the chart area or trust the user sees the chart change)
    
    // Update Chart Title
    const titleElement = document.querySelector('.card-header h5');
    titleElement.innerText = `Price Trend (${coinId.toUpperCase()} - Last 7 Days)`;

    // Fetch History for this specific coin
    try {
        const response = await fetch(`/api/history/${coinId}`);
        const data = await response.json();
        
        if(data.prices) {
            renderChart(data.prices, data.labels, data.color, coinId);
        }
    } catch (error) {
        console.error("Error fetching history:", error);
    }
}

// --- Function 3: Render/Update the Chart ---
function renderChart(prices, labels, color, coinName) {
    const ctx = document.getElementById('cryptoChart').getContext('2d');

    // IMPORTANT: If a chart already exists, destroy it before making a new one
    if (cryptoChartInstance) {
        cryptoChartInstance.destroy();
    }

    cryptoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${coinName.toUpperCase()} Price (USD)`,
                data: prices,
                borderColor: color || 'rgba(255, 193, 7, 1)',
                backgroundColor: color ? color.replace('1)', '0.2)') : 'rgba(255, 193, 7, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
    
}
// --- Function 4: Set Custom Alert ---
async function setAlertPrice() {
    const inputField = document.getElementById("alert-input");
    const newPrice = inputField.value;

    if (!newPrice) {
        alert("Please enter a valid price!");
        return;
    }

    try {
        const response = await fetch('/api/set-alert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ price: newPrice })
        });

        const result = await response.json();
        
        if (result.status === "success") {
            alert(`✅ Alert set! You will be notified if Bitcoin drops below $${result.new_threshold}`);
        } else {
            alert("❌ Failed to set alert.");
        }
    } catch (error) {
        console.error("Error setting alert:", error);
        alert("❌ Network Error");
    }
}