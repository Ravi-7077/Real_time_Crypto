# 📈 Scalable Cryptocurrency Real-Time Price Tracker on AWS

[![Live Demo](https://img.shields.io/badge/Live_Demo-Running_on_AWS-orange?style=for-the-badge&logo=amazon-aws)](http://3.85.188.5/)
[![Python](https://img.shields.io/badge/Python-3.9-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0-green?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)

A cloud-native web application that tracks real-time cryptocurrency prices, visualizes historical trends, and sends automated alerts via AWS SNS when prices drop below user-defined thresholds. Built with Python (Flask) and deployed on AWS EC2 with DynamoDB for storage.

### 🚀 **Live Demo:** [http://3.85.188.5/](http://3.85.188.5/)

---

## 📖 About the Project

In the volatile world of cryptocurrency, milliseconds matter. This project is a **scalable, full-stack solution** designed to monitor the market in real-time. 

Unlike simple trackers, this application leverages **AWS Cloud Infrastructure** to ensure reliability and scalability. It automatically fetches data from the CoinGecko API, stores historical data points in a NoSQL database (DynamoDB) for trend analysis, and uses a decoupled notification service (SNS) to alert users immediately when market conditions change.

### Key Features
* **📊 Real-Time Dashboard:** Live price updates for major cryptocurrencies (Bitcoin, Ethereum, Solana, etc.) without page reloads.
* **📉 Interactive Historical Charts:** Dynamic line charts powered by Chart.js that visualize price trends over time, fetching data stored in DynamoDB.
* **🔔 Smart Alert System:** Users can set custom price thresholds. If a coin drops below the limit, the system triggers an **AWS SNS** notification (Email/SMS).
* **🔐 User Authentication:** Secure Login and Registration system using `Flask-Login` and `Bcrypt` hashing.
* **☁️ Cloud-Native Architecture:**
    * **Compute:** Hosted on AWS EC2 (Amazon Linux 2023).
    * **Database:** AWS DynamoDB for low-latency storage of price history.
    * **Notifications:** AWS SNS (Simple Notification Service) for decoupled alerts.
    * **Security:** IAM Roles and Security Groups configured for least-privilege access.

---

## 🏗️ Architecture

The application follows a standard MVC architecture enhanced with AWS Cloud services:

1.  **Frontend:** HTML5, Bootstrap 5, and Chart.js for visualization.
2.  **Backend:** Python Flask application serving the API and handling business logic.
3.  **Data Ingestion:** A background scheduler fetches data from CoinGecko every 60 seconds.
4.  **Storage:** Data is normalized and pushed to **AWS DynamoDB** (`CryptoHistory` table).
5.  **Alerting:** If logic conditions are met, a message is published to an **AWS SNS Topic** (`CryptoAlerts`), which pushes to subscribed users.

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS (Bootstrap 5), JavaScript, Chart.js
* **Backend:** Python 3.9, Flask
* **Database:** AWS DynamoDB (NoSQL)
* **Cloud Services:** AWS EC2, AWS SNS, AWS IAM
* **External API:** CoinGecko API
* **Security:** Flask-Bcrypt, IAM Roles

---

## 📸 Screenshots

*(Optional: Add screenshots of your dashboard here)*

| Dashboard View | Historical Charts | Login Screen |
|:---:|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/300x200?text=Dashboard+UI) | ![Charts](https://via.placeholder.com/300x200?text=Chart+View) | ![Login](https://via.placeholder.com/300x200?text=Login+Page) |

---

## ⚙️ Installation & Local Setup

If you want to run this project locally:

1.  **Clone the Repo**
    ```bash
    git clone [https://github.com/your-username/crypto-tracker-aws.git](https://github.com/your-username/crypto-tracker-aws.git)
    cd crypto-tracker-aws
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set Environment Variables**
    (Or rely on the defaults in `application.py` for local dev)
    ```bash
    export FLASK_APP=application.py
    ```

4.  **Run the App**
    ```bash
    flask run
    ```
    Access at `http://localhost:5000`

---

## ☁️ AWS Deployment Steps

This project was deployed using the following AWS pipeline:

1.  **IAM Role Creation:** Created a custom role (`custom_user_role`) with policies for `AmazonDynamoDBFullAccess` and `AmazonSNSFullAccess`.
2.  **Infrastructure Setup:**
    * Created DynamoDB Table: `CryptoHistory` (Partition Key: `coin_id`).
    * Created SNS Topic: `CryptoAlerts`.
3.  **EC2 Launch:**
    * Launched Amazon Linux 2023 instance.
    * Attached IAM Role for secure, keyless access to AWS services.
    * Configured Security Groups to allow inbound traffic on Port 5000.
4.  **Deployment:**
    * Cloned repository to `/home/ec2-user/`.
    * Installed dependencies via `pip`.
    * Ran application with Gunicorn/Flask bound to `0.0.0.0`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Project built by Ravi.**
