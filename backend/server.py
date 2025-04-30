from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# File-based storage
EVENTS_FILE = os.path.join(os.path.dirname(__file__), 'events.json')


def load_events():
    """Load events from JSON file"""
    try:
        if not os.path.exists(EVENTS_FILE):
            with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump({}, f)
            return {}

        with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}  # Return empty dict if file is corrupted


def save_events(events):
    """Save events to JSON file"""
    try:
        with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(events, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print("Save error:", str(e))
        raise


@app.route("/api/events", methods=["GET", "OPTIONS"])
def get_events():
    """Handle both GET and OPTIONS for /api/events"""
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify(load_events())


@app.route("/api/events", methods=["POST"])
def add_event():
    try:
        print("Raw request data:", request.data)  # Debug line
        data = request.get_json(force=True)
        print("Parsed JSON:", data)  # Debug line

        if not data or 'date' not in data or 'event' not in data:
            return jsonify({"error": "Invalid data"}), 400

        events = load_events()
        events[data["date"]] = data["event"]
        save_events(events)
        return jsonify({"status": "success"})
    except Exception as e:
        print("Error:", str(e))  # Debug line
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<date>", methods=["DELETE"])
def delete_event(date):
    """Delete event by date"""
    try:
        events = load_events()
        if date in events:
            del events[date]
            save_events(events)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
