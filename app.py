from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

# --- Configuration ---
COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"
COINS = "bitcoin,ethereum,dogecoin"
CURRENCY = "usd"

# --- Global State ---
app_state = {
    "alert_threshold": 30000,  # Default
    "alert_triggered": False   # Keeps track if we already alerted the user
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/prices')
def get_prices():
    try:
        # 1. Fetch Data
        params = {'ids': COINS, 'vs_currencies': CURRENCY}
        response = requests.get(COINGECKO_API_URL, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            # 2. Check Logic (Server Side)
            current_btc = data['bitcoin']['usd']
            threshold = app_state["alert_threshold"]
            should_alert = False

            # If price drops below threshold AND we haven't alerted yet
            if current_btc < threshold and not app_state["alert_triggered"]:
                should_alert = True
                app_state["alert_triggered"] = True  # Mark as done so we don't spam
            
            # Reset logic: If price recovers, re-enable the alert
            if current_btc > threshold:
                app_state["alert_triggered"] = False

            # 3. Add the alert status to the response
            # We combine the price data with our custom alert flag
            response_data = {
                "prices": data,
                "alert": should_alert,
                "threshold_value": threshold
            }
            return jsonify(response_data)
        else:
            return jsonify({"error": "Failed to fetch data"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/set-alert', methods=['POST'])
def set_alert():
    data = request.json
    new_price = data.get('price')
    if new_price:
        app_state["alert_threshold"] = float(new_price)
        app_state["alert_triggered"] = False # Reset trigger
        return jsonify({"status": "success", "new_threshold": new_price})
    return jsonify({"error": "Invalid data"}), 400

# (Keep the get_history route as is from previous steps)
@app.route('/api/history/<coin_id>')
def get_history(coin_id):
    # Mock data same as before
    mock_history = {
        "bitcoin": {"prices": [29500, 31000, 30500, 30200, 31500, 32000, 32500], "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "color": "rgba(255, 193, 7, 1)"},
        "ethereum": {"prices": [1800, 1850, 1810, 1790, 1880, 1900, 1950], "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "color": "rgba(60, 60, 60, 1)"},
        "dogecoin": {"prices": [0.07, 0.072, 0.069, 0.070, 0.075, 0.078, 0.08], "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "color": "rgba(255, 193, 7, 1)"}
    }
    return jsonify(mock_history.get(coin_id, {}))

if __name__ == '__main__':
    app.run(debug=True)