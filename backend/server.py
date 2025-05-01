from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# File-based storage
EVENTS_FILE = os.path.join(os.path.dirname(__file__), 'events.json')


def load_events():
    """Load events from JSON file"""
    try:
        if not os.path.exists(EVENTS_FILE):
            with open(EVENTS_FILE, 'w') as f:
                json.dump({}, f)
            return {}

        with open(EVENTS_FILE, 'r') as f:
            data = json.load(f)

            # Convert old format to new format if needed
            for date in data:
                if isinstance(data[date], str):
                    data[date] = [{
                        "id": str(uuid.uuid4()),
                        "text": data[date],
                        "timestamp": datetime.now().isoformat()
                    }]
            return data

    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def save_events(events):
    """Save events to JSON file"""
    with open(EVENTS_FILE, 'w') as f:
        json.dump(events, f, indent=4, ensure_ascii=False)


@app.route("/api/events", methods=["GET", "OPTIONS"])
def get_events():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify(load_events())


@app.route("/api/events", methods=["POST"])
def add_event():
    try:
        data = request.get_json()
        date = data['date']
        event_text = data['event'].strip()

        if not date or not event_text:
            return jsonify({"error": "Invalid data"}), 400

        events = load_events()

        # Create array if date doesn't exist
        if date not in events:
            events[date] = []

        # Add new event with unique ID
        events[date].append({
            "id": str(uuid.uuid4()),
            "text": event_text,
            "timestamp": datetime.now().isoformat()
        })

        save_events(events)
        return jsonify({"status": "success"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<date>/<event_id>", methods=["DELETE"])
def delete_event(date, event_id):
    try:
        events = load_events()

        if date in events:
            # Remove the event with matching ID
            events[date] = [e for e in events[date] if e['id'] != event_id]

            # Remove date entry if no events left
            if not events[date]:
                del events[date]

        save_events(events)
        return jsonify({"status": "success"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/all")
def get_all_events():
    return jsonify(load_events())


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
