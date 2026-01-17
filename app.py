from urllib import request
from flask import Flask, render_template, jsonify
import requests
import time
app_state = {
    "alert_threshold": 30000,  # Default Value
    "alert_active": True,      # Master switch for alerts
    "alert_sent_today": False  # To prevent spam
}

app = Flask(__name__)

# --- Configuration ---
COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"
# We want to fetch these coins
COINS = "bitcoin,ethereum,dogecoin"
CURRENCY = "usd"

# --- Routes ---

@app.route("/")
def index():
    """
    Serves the HTML page. 
    Flask looks for this in the 'templates' folder.
    """
    return render_template("index.html")

@app.route('/api/prices')
def get_prices():
    """
    Fetches real-time prices from CoinGecko API
    and returns them as JSON to our frontend.
    """
    try:
        # Define parameters for the API call
        params = {
            'ids': COINS,
            'vs_currencies': CURRENCY
        }
        
        # Make the request to CoinGecko
        response = requests.get(COINGECKO_API_URL, params=params)
        
        # Check if the API call was successful
        if response.status_code == 200:
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({"error": "Failed to fetch data from API"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/history/<coin_id>')
def get_history(coin_id):
    """
    Returns mock historical data for the requested coin.
    """
    # Expanded mock data for better visualization
    mock_history = {
        "bitcoin": {
            "prices": [29500, 29800, 31000, 30500, 30200, 31500, 32000],
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "color": "rgba(255, 193, 7, 1)"  # Orange
        },
        "ethereum": {
            "prices": [1800, 1820, 1850, 1810, 1790, 1880, 1900],
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "color": "rgba(60, 60, 60, 1)"   # Dark Grey/Black
        },
        "dogecoin": {
            "prices": [0.070, 0.071, 0.072, 0.069, 0.070, 0.075, 0.078],
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "color": "rgba(255, 193, 7, 1)"  # Gold
        }
    }
    data = mock_history.get(coin_id, {})
    return jsonify(data)
    
    # Return data or empty list if coin not found
    
@app.route('/api/set-alert', methods=['POST'])
def set_alert():
        """
        Receives new alert settings from the frontend.
        Expects JSON like: {"price": 50000}
        """
        data = request.json
        new_price = data.get('price')

        if new_price:
            app_state["alert_threshold"] = float(new_price)
            app_state["alert_sent_today"] = False # Reset so we can get a new alert
            print(f"✅ Alert Threshold Updated to: ${app_state['alert_threshold']}")
            return jsonify({"status": "success", "new_threshold": app_state["alert_threshold"]})

        return jsonify({"error": "Invalid data"}), 400
    


if __name__ == '__main__':
    # Debug mode allows the server to auto-reload when you save code changes
    app.run(debug=True)