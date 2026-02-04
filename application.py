import os
import requests
import boto3
from flask import Flask, render_template, jsonify, request, redirect, url_for
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from datetime import datetime
from boto3.dynamodb.conditions import Key # Needed for efficient querying

# --- AWS Configuration ---
application = app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_secret_key_change_this_in_aws")
CORS(app)
bcrypt = Bcrypt(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# --- AWS Clients ---
# We use conditional logic to prevent crashing if running locally without AWS credentials
REGION = "us-east-1"
try:
    sns_client = boto3.client("sns", region_name=REGION)
    dynamodb = boto3.resource("dynamodb", region_name=REGION)
except Exception as e:
    print(f"AWS Clients failed to initialize (Ignore if running locally): {e}")
    sns_client = None
    dynamodb = None

# FIX: Correctly fetch the Env Var, or use the hardcoded ARN as a fallback
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:503561412984:CryptoAlerts")
DYNAMO_TABLE_NAME = os.environ.get("DYNAMO_TABLE_NAME", "CryptoHistory")

if dynamodb:
    history_table = dynamodb.Table(DYNAMO_TABLE_NAME)

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
        return render_template("login.html", error="Invalid Credentials")
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
    return render_template("index.html",
                           user=current_user.id,
                           coin="bitcoin",
                           alert_threshold=app_state.get("alert_threshold", 30000))

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
            current_btc = data.get("bitcoin", {}).get("usd", 0)
            threshold = app_state["alert_threshold"]
            should_alert = False

            if current_btc < threshold and not app_state["alert_triggered"]:
                should_alert = True
                app_state["alert_triggered"] = True

                # --- Send SNS Alert ---
                if sns_client and SNS_TOPIC_ARN:
                    try:
                        sns_client.publish(
                            TopicArn=SNS_TOPIC_ARN,
                            Message=f"Bitcoin price dropped below {threshold}! Current: {current_btc}",
                            Subject="Crypto Alert"
                        )
                        print("✅ SNS Alert Sent")
                    except Exception as e:
                        print(f"❌ SNS Failed: {e}")

                # --- Save to DynamoDB ---
                if dynamodb:
                    try:
                        history_table.put_item(Item={
                            "coin_id": "bitcoin", # Matches Partition Key defined in AWS
                            "timestamp": int(datetime.utcnow().timestamp()), # Use Number for Sort Key
                            "price": str(current_btc),
                            "alert_triggered": True
                        })
                    except Exception as e:
                        print(f"❌ DB Save Failed: {e}")

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

@app.route("/api/history/<coin_id>")
def get_history(coin_id):
    try:
        if not dynamodb:
            return jsonify({"error": "Database not connected"}), 500
            
        # --- FIX: Use Query instead of Scan ---
        # Query is much faster and cheaper than scanning the whole table
        response = history_table.query(
            KeyConditionExpression=Key('coin_id').eq(coin_id),
            Limit=50, # Only get the last 50 records
            ScanIndexForward=False # Get newest first
        )
        
        items = response.get("Items", [])
        
        # Sort back to oldest-first for the chart
        items.reverse()

        prices = [float(item["price"]) for item in items]
        # Convert timestamp number back to readable time
        labels = [datetime.fromtimestamp(int(item["timestamp"])).strftime('%H:%M') for item in items]

        return jsonify({
            "prices": prices,
            "labels": labels,
            "color": "rgba(59,130,246,1)"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    application.run(debug=True)
