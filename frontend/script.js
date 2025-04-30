// =====================
// Calendar Core Logic
// =====================
const API_BASE = "http://localhost:5000";  // PC-only development
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// ---------------------
// API Communication
// ---------------------

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/api/events`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return {};
    }
}

async function saveEvent(date, eventText) {
    try {
        const response = await fetch(`${API_BASE}/api/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, event: eventText })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to save event");
        }
    } catch (error) {
        console.error("Save Error:", error);
        alert(error.message || "Failed to save event");
        throw error;
    }
}

async function deleteEvent(date) {
    try {
        const response = await fetch(`${API_BASE}/api/events/${date}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });
        
        if (!response.ok) {
            throw new Error("Failed to delete event");
        }
    } catch (error) {
        console.error("Delete Error:", error);
        alert(error.message || "Failed to delete event");
        throw error;
    }
}

// ---------------------
// Calendar Generation (unchanged)
// ---------------------

async function generateCalendar(year, month) {
    const daysContainer = document.getElementById("calendar-days");
    daysContainer.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const events = await loadEvents();

    for (let i = 0; i < firstDay; i++) {
        daysContainer.appendChild(createDayElement(""));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDateKey(year, month, day);
        const dayElement = createDayElement(day, dateKey);
        
        if (isToday(year, month, day)) {
            dayElement.classList.add("today");
        }

        if (events[dateKey]) {
            const eventElement = document.createElement("div");
            eventElement.className = "calendar-event";
            eventElement.textContent = events[dateKey];
            dayElement.appendChild(eventElement);
        }

        daysContainer.appendChild(dayElement);
    }

    updateCalendarTitle();
}

function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isToday(year, month, day) {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
}

function createDayElement(day, dateKey) {
    const div = document.createElement("div");
    if (day) {
        div.textContent = day;
        div.addEventListener("click", () => showEventPopup(dateKey));
    }
    return div;
}

// ---------------------
// Popup Management (optimized)
// ---------------------

let currentPopup = null;

async function showEventPopup(dateKey) {
    removePopup();

    const events = await loadEvents();
    const eventText = events[dateKey] || "";

    const popup = document.createElement("div");
    popup.className = "event-popup";
    popup.innerHTML = `
        <h3>${dateKey}</h3>
        <input type="text" id="edit-event-text" value="${escapeHtml(eventText)}" 
               placeholder="Event description">
        <div class="popup-buttons">
            ${eventText ? `<button class="delete-btn">Delete</button>` : ''}
            <button class="save-btn">${eventText ? 'Save' : 'Add'}</button>
            <button class="close-btn">Close</button>
        </div>
    `;

    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    currentPopup = { popup, overlay };

    const textField = popup.querySelector("#edit-event-text");
    textField.focus();
    textField.setSelectionRange(textField.value.length, textField.value.length);

    // Single event handler for all buttons
    popup.addEventListener("click", (e) => {
        if (e.target.classList.contains("close-btn")) {
            removePopup();
        } else if (e.target.classList.contains("save-btn")) {
            handleSave(dateKey, textField.value.trim());
        } else if (e.target.classList.contains("delete-btn")) {
            handleDelete(dateKey);
        }
    });

    // Keyboard support
    textField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleSave(dateKey, textField.value.trim());
        } else if (e.key === "Escape") {
            removePopup();
        }
    });
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
}

async function handleSave(dateKey, text) {
    try {
        await saveEvent(dateKey, text);
        refreshCalendar();
        removePopup();
    } catch (error) {
        // Error already shown by saveEvent
    }
}

async function handleDelete(dateKey) {
    try {
        await deleteEvent(dateKey);
        refreshCalendar();
        removePopup();
    } catch (error) {
        // Error already shown by deleteEvent
    }
}

function removePopup() {
    if (currentPopup) {
        currentPopup.popup.remove();
        currentPopup.overlay.remove();
        currentPopup = null;
    }
}

// ---------------------
// Calendar Navigation (unchanged)
// ---------------------

function refreshCalendar() {
    generateCalendar(currentYear, currentMonth);
}

function updateCalendarTitle() {
    document.getElementById("current-month").textContent = 
        `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
}

// ---------------------
// Event Listeners (optimized)
// ---------------------

function initEventListeners() {
    document.getElementById("prev-month").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        refreshCalendar();
    });

    document.getElementById("next-month").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        refreshCalendar();
    });

    document.getElementById("add-event").addEventListener("click", async () => {
        const date = document.getElementById("event-date").value;
        const text = document.getElementById("event-text").value.trim();

        if (!date || !text) {
            alert("Please fill both fields!");
            return;
        }

        try {
            await saveEvent(date, text);
            document.getElementById("event-text").value = "";
            
            const [year, month] = date.split("-").map(Number);
            if (year === currentYear && month-1 === currentMonth) {
                refreshCalendar();
            }
        } catch (error) {
            // Error already shown by saveEvent
        }
    });
}

// ---------------------
// Initialization
// ---------------------

document.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
    generateCalendar(currentYear, currentMonth);
});