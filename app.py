import os
import requests
from flask import Flask, render_template, jsonify, request, redirect, url_for
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "devkey")  # safer than hardcoding
CORS(app)
bcrypt = Bcrypt(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# --- Mock User Database ---
users = {
    "ravi@example.com": {
        "password": bcrypt.generate_password_hash("password123").decode("utf-8")
    }
}

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_manager.user_loader
def load_user(user_id):
    if user_id in users:
        return User(user_id)
    return None

# --- Login Routes ---
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        if email in users and bcrypt.check_password_hash(users[email]["password"], password):
            user = User(email)
            login_user(user)
            return redirect(url_for("index"))
        return "Invalid credentials", 401
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# --- Dashboard ---
@app.route("/")
@login_required
def index():
    # default coin and current alert threshold are passed to template
    return render_template("index.html", user=current_user.id, coin="bitcoin", alert_threshold=app_state.get("alert_threshold", 30000))

# --- Crypto API Config ---
COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"
COINS = "bitcoin,ethereum,dogecoin,solana,cardano,polkadot,tron,litecoin"
CURRENCY = "usd"

app_state = {
    "alert_threshold": 30000,
    "alert_triggered": False
}

@app.route("/api/prices")
def get_prices():
    try:
        params = {"ids": COINS, "vs_currencies": CURRENCY}
        response = requests.get(COINGECKO_API_URL, params=params)
        if response.status_code == 200:
            data = response.json()
            current_btc = data["bitcoin"]["usd"]
            threshold = app_state["alert_threshold"]
            should_alert = False

            if current_btc < threshold and not app_state["alert_triggered"]:
                should_alert = True
                app_state["alert_triggered"] = True
            if current_btc > threshold:
                app_state["alert_triggered"] = False

            return jsonify({
                "prices": data,
                "alert": should_alert,
                "threshold_value": threshold
            })
        return jsonify({"error": "Failed to fetch data"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/set-alert", methods=["POST"])
def set_alert():
    data = request.json
    new_price = data.get("price")
    if new_price:
        app_state["alert_threshold"] = float(new_price)
        app_state["alert_triggered"] = False
        return jsonify({"status": "success", "new_threshold": new_price})
    return jsonify({"error": "Invalid data"}), 400

# --- Real History Endpoint ---
@app.route("/api/history/<coin_id>")
def get_history(coin_id):
    try:
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
        params = {"vs_currency": "usd", "days": 7}
        response = requests.get(url, params=params)

        if response.status_code == 200:
            data = response.json()
            prices = [p[1] for p in data["prices"]]

            # Convert timestamps to weekday names
            from datetime import datetime
            labels = [datetime.utcfromtimestamp(p[0]/1000).strftime("%a") for p in data["prices"]]

            coin_colors = {
                "bitcoin": "rgba(255, 193, 7, 1)",
                "ethereum": "rgba(60, 60, 60, 1)",
                "dogecoin": "rgba(255, 193, 7, 1)",
                "solana": "rgba(16, 185, 129, 1)",
                "cardano": "rgba(59, 130, 246, 1)",
                "polkadot": "rgba(236, 72, 153, 1)",
                "tron": "rgba(244, 63, 94, 1)",
                "litecoin": "rgba(107, 114, 128, 1)"
            }

            return jsonify({
                "prices": prices,
                "labels": labels,
                "color": coin_colors.get(coin_id, "rgba(59,130,246,1)")
            })

        return jsonify({"error": "Failed to fetch history"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)