// =====================
// Global Config
// =====================
const API_BASE = "https://my-calendar-app-1.onrender.com";
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let currentPopup = null;
let fuse = null;
let allEvents = [];

// =====================
// Initialization
// =====================
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  generateCalendar(currentYear, currentMonth);
});

function initEventListeners() {
  // Month Navigation
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

  // Add Event Button
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
      if (
        date.startsWith(
          `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
        )
      ) {
        await refreshCalendar();
      }
    } catch (error) {
      console.error("Add event error:", error);
    }
  });

  // Events Panel
  document
    .querySelector(".toggle-panel")
    .addEventListener("click", toggleEventPanel);
  document
    .getElementById("search-events")
    .addEventListener("input", handleSearch);
}

// =====================
// Calendar Core
// =====================
async function generateCalendar(year, month) {
  const daysContainer = document.getElementById("calendar-days");
  daysContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const events = await loadEvents();

  // Empty day placeholders
  for (let i = 0; i < firstDay; i++) {
    daysContainer.appendChild(createDayElement(""));
  }

  // Create days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(year, month, day);
    const dayElement = createDayElement(day, dateKey);

    if (isToday(year, month, day)) {
      dayElement.classList.add("today");
    }

    if (events[dateKey]) {
      events[dateKey].forEach((event) => {
        dayElement.appendChild(createEventElement(event, dateKey));
      });
    }

    daysContainer.appendChild(dayElement);
  }

  updateCalendarTitle();
}

function createDayElement(day, dateKey) {
  const div = document.createElement("div");
  if (day) {
    div.textContent = day;

    // Modified click handler
    div.addEventListener("click", (e) => {
      if (!e.target.closest(".delete-event-btn")) {
        // Don't open popup if deleting
        showEventPopup(dateKey);
      }
    });
  }
  return div;
}

function createEventElement(event, dateKey) {
  const eventDiv = document.createElement("div");
  eventDiv.className = "calendar-event";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-event-btn";
  deleteBtn.textContent = "×";

  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation(); // Still needed for other interactions
    if (confirm("Delete this event?")) {
      await deleteEvent(dateKey, event.id);
      await refreshCalendar();
    }
  });

  eventDiv.innerHTML = `<span>${event.text}</span>`;
  eventDiv.appendChild(deleteBtn);

  return eventDiv;
}

// =====================
// Event Management
// =====================
async function loadEvents() {
  try {
    const response = await fetch(`${API_BASE}/api/events`);
    return await response.json();
  } catch (error) {
    console.error("Load Error:", error);
    return {};
  }
}

async function saveEvent(date, text) {
  try {
    const response = await fetch(`${API_BASE}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, event: text }),
    });

    if (!response.ok) throw new Error("Failed to save event");
    return true;
  } catch (error) {
    alert(error.message);
    return false;
  }
}

async function deleteEvent(date, eventId) {
  try {
    const response = await fetch(
      `${API_BASE}/api/events/${encodeURIComponent(date)}/${encodeURIComponent(
        eventId
      )}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) throw new Error("Failed to delete event");
    return true;
  } catch (error) {
    alert(error.message);
    return false;
  }
}

async function updateEvent(date, eventId, newText) {
  try {
    await deleteEvent(date, eventId);
    const success = await saveEvent(date, newText);

    if (success) {
      await refreshCalendar();
      removePopup();
    }
  } catch (error) {
    alert("Error updating event: " + error.message);
  }
}

// =====================
// Events Panel & Search
// =====================
async function toggleEventPanel() {
  const panel = document.querySelector(".events-panel");
  panel.classList.toggle("active");

  if (panel.classList.contains("active")) {
    const response = await fetch(`${API_BASE}/api/events/all`);
    const eventsData = await response.json();

    allEvents = [];
    for (const date in eventsData) {
      eventsData[date].forEach((event) => {
        allEvents.push({ date, ...event });
      });
    }

    fuse = new Fuse(allEvents, {
      keys: ["text", "date"],
      threshold: 0.3,
    });

    updateSearchResults(allEvents);
  }
}

function handleSearch(e) {
  if (!fuse) return;

  const results =
    e.target.value.trim() === ""
      ? allEvents
      : fuse.search(e.target.value).map((r) => r.item);

  updateSearchResults(results);
}

function updateSearchResults(events) {
  const container = document.getElementById("search-results");
  container.innerHTML = events
    .map(
      (event) => `
        <div class="search-result-item" data-date="${event.date}">
            <strong>${event.date}</strong><br>
            ${event.text}
        </div>
    `
    )
    .join("");

  // Add click handlers to search results
  container.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", () => {
      const [year, month] = item.dataset.date.split("-");
      currentYear = parseInt(year);
      currentMonth = parseInt(month) - 1;
      refreshCalendar();
      document.querySelector(".events-panel").classList.remove("active");
    });
  });
}

// =====================
// Event Popup
// =====================
async function showEventPopup(dateKey) {
  removePopup();

  const events = await loadEvents();
  const dateEvents = events[dateKey] || [];

  const popup = document.createElement("div");
  popup.className = "event-popup";
  popup.innerHTML = `
    <h3>${dateKey}</h3>
    <div class="existing-events">
      ${dateEvents
        .map(
          (event) => `
        <div class="event-item">
          <span class="event-text">${event.text}</span>
          <button onclick="handleDelete('${dateKey}', '${event.id}')">Delete</button>
        </div>
      `
        )
        .join("")}
    </div>
    <input type="text" id="event-input" placeholder="New event description...">
    <div class="popup-buttons">
      <button onclick="handleAdd('${dateKey}')">Add Event</button>
      <button onclick="removePopup()">Close</button>
    </div>
  `;

  // Add these listeners
  overlay.addEventListener("click", removePopup);
  popup.addEventListener("click", (e) => e.stopPropagation()); // Prevent clicks inside popup from closing it

  // Add edit functionality
  popup.querySelectorAll(".event-text").forEach((textElement, index) => {
    textElement.addEventListener("click", () => {
      const newText = prompt("Edit event:", dateEvents[index].text);
      if (newText !== null && newText.trim() !== "") {
        updateEvent(dateKey, dateEvents[index].id, newText.trim());
      }
    });
  });

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  currentPopup = { popup, overlay };

  // Keyboard shortcuts
  document.getElementById("event-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAdd(dateKey);
    if (e.key === "Escape") removePopup();
  });

  document.getElementById("event-input").focus();
}

async function handleAdd(dateKey) {
  const input = document.getElementById("event-input");
  const text = input.value.trim();

  if (text) {
    const success = await saveEvent(dateKey, text);
    if (success) {
      await refreshCalendar();
      removePopup();
    }
  }
}

async function handleDelete(dateKey, eventId) {
  if (confirm("Are you sure you want to delete this event?")) {
    const success = await deleteEvent(dateKey, eventId);
    if (success) {
      await refreshCalendar();
      removePopup(); // Only close - don't reopen
    }
  }
}

function removePopup() {
  if (currentPopup) {
    currentPopup.popup.remove();
    currentPopup.overlay.remove();
    currentPopup = null;
  }
}

// =====================
// Utilities
// =====================
function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function isToday(year, month, day) {
  const today = new Date();
  return (
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate()
  );
}

async function refreshCalendar() {
  await generateCalendar(currentYear, currentMonth);
}

function updateCalendarTitle() {
  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "default",
    {
      month: "long",
    }
  );
  document.getElementById(
    "current-month"
  ).textContent = `${monthName} ${currentYear}`;
}
