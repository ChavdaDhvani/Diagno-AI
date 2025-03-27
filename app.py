from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import json
import os
import pandas as pd

app = Flask(__name__)
app.secret_key = "supersecretkey"

USERS_FILE = "users.json"
HISTORY_FILE = "history.json"
TREATMENTS_FILE = "treatments.json"
CSV_PATH = r"D:/Diagno_AI/dataset_clean1.csv"

# ✅ Load users safely from JSON
def load_users():
    if not os.path.exists(USERS_FILE):
        return {}  # If file doesn't exist, return empty dictionary

    try:
        with open(USERS_FILE, "r") as file:
            data = file.read().strip()  # Read and remove any extra whitespace
            return json.loads(data) if data else {}  # If empty, return {}
    except json.JSONDecodeError:
        return {}  # If JSON decoding fails, return {}

# ✅ Save users safely to JSON
def save_users(users):
    with open(USERS_FILE, "w") as file:
        json.dump(users, file, indent=4)

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as file:
            return json.load(file)
    return {}

# Save symptom history
def save_history(history):
    with open(HISTORY_FILE, "w") as file:
        json.dump(history, file, indent=4)

# Load treatment suggestions
def load_treatments():
    if os.path.exists(TREATMENTS_FILE):
        with open(TREATMENTS_FILE, "r") as file:
            return json.load(file)
    return {}
       

@app.route('/')
def index():
    return render_template("register.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/main")
def main():
    if "user" not in session:
        return redirect(url_for("login"))  # Redirect if not logged in
    return render_template("main.html")

@app.route("/register", methods=["POST"])
def register_user():
    users = load_users()
    username = request.form["username"]
    password = request.form["password"]

    if username in users:
        return "User already exists. <a href='/login'>Login here</a>"

    users[username] = password
    save_users(users)

    # ✅ Auto-login after registration
    session["user"] = username
    return redirect(url_for("main"))  # Redirect to main page

@app.route("/login", methods=["POST"])
def login_user():
    users = load_users()
    username = request.form["username"]
    password = request.form["password"]

    if username in users and users[username] == password:
        session["user"] = username
        return redirect(url_for("main"))  # Redirect to main page

    return "Invalid credentials. <a href='/login'>Try again</a>"



@app.route("/check_session")
def check_session():
    return jsonify({"logged_in": "user" in session})

@app.route('/find', methods=['POST'])
def find_symptoms():
    try:
        # Load CSV data
        df = pd.read_csv(CSV_PATH, names=["disease", "symptom", "number"])

        # Get user symptoms from request
        user_symptoms = request.get_json().get('symptoms', [])
        user_symptoms = set(user_symptoms)  # Convert list to set for easy lookup

        # Find all numbers associated with the user symptoms
        matched_rows = df[df["symptom"].isin(user_symptoms)]
        related_numbers = matched_rows["number"].unique()

        if len(related_numbers) == 0:
            return jsonify({"suggested_symptoms": []})  # No matches found

        # Find all symptoms with the same numbers
        related_symptoms = df[df["number"].isin(related_numbers)]["symptom"].unique()

        # Remove already selected symptoms
        suggested_symptoms = list(set(related_symptoms) - user_symptoms)

        return jsonify({"suggested_symptoms": suggested_symptoms[:4]})  # Return top 4 suggestions

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/disease', methods=['POST'])
def search():
    try:
        df = pd.read_csv(CSV_PATH, names=["disease", "symptom", "number"])

        user_symptoms = request.get_json().get('symptoms', [])
        user_symptoms = set(user_symptoms)

        # Match user symptoms with dataset
        matched_rows = df[df["symptom"].isin(user_symptoms)]

        if matched_rows.empty:
            return render_template("result.html", disease="No matching disease found.")

        # Count occurrences of each disease based on matching symptoms
        disease_counts = matched_rows["disease"].value_counts()

        # Get the disease with the most matching symptoms
        most_probable_disease = disease_counts.idxmax()

        return render_template("result.html", disease=most_probable_disease)

    except Exception as e:
        return render_template("result.html", disease="Error: " + str(e))


if __name__ == '__main__':
    app.run(debug=True, port=3000)
