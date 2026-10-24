/* ============================================
   HOLIWISE — PUBLIC HOLIDAY PLANNER
   Part 1: Setup and helper functions
   ============================================ */

"use strict";

/* 1. DOM ELEMENTS */

const countrySelect = document.getElementById("countrySelect");
const yearSelect = document.getElementById("yearSelect");
const loadBtn = document.getElementById("loadBtn");
const monthSelect = document.getElementById("monthSelect");
const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");

const totalHolidaysEl = document.getElementById("totalHolidays");
const nationwideHolidaysEl = document.getElementById("nationwideHolidays");
const activeMonthsEl = document.getElementById("activeMonths");
const nextHolidayEl = document.getElementById("nextHoliday");
const nextHolidayDateEl = document.getElementById("nextHolidayDate");

// Live Holiday Countdown elements
const countdownHolidayNameEl =
    document.getElementById("countdownHolidayName");

const countdownHolidayDateEl =
    document.getElementById("countdownHolidayDate");

const countdownDaysEl =
    document.getElementById("countdownDays");

const countdownHoursEl =
    document.getElementById("countdownHours");

const countdownMinutesEl =
    document.getElementById("countdownMinutes");

const countdownSecondsEl =
    document.getElementById("countdownSeconds");

let countdownInterval = null;

const calendarGrid = document.getElementById("calendarGrid");
const holidayTableBody = document.getElementById("holidayTableBody");

const statusMessage = document.querySelector(".status-message");
const resultCountEl = document.getElementById("resultCount");


/* 2. APPLICATION STATE */

let allCountries = [];
let allHolidays = [];
let filteredHolidays = [];

let selectedYear = new Date().getFullYear();
let selectedCountry = "";
let selectedMonth = "all";
let isLoading = false;


/* 3. HELPER FUNCTIONS */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseHolidayDate(dateString) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
        String(dateString || "")
    );

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}


function formatDate(dateString, options = {}) {
    const date = parseHolidayDate(dateString);

    if (!date) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...options
    });
}


function getMonthName(monthIndex) {
    return new Date(2000, monthIndex, 1).toLocaleDateString("en", {
        month: "long"
    });
}


function getCountryName(countryCode) {
    const country = allCountries.find(
        item => item.countryCode === countryCode
    );

    return country ? country.name : countryCode;
}


function showStatus(message, type = "") {
    if (!statusMessage) {
        return;
    }

    statusMessage.textContent = message;
    statusMessage.className = "status-message";

    if (type) {
        statusMessage.classList.add(type);
    }

    statusMessage.hidden = false;
}


function hideStatus() {
    if (statusMessage) {
        statusMessage.hidden = true;
        statusMessage.textContent = "";
        statusMessage.className = "status-message";
    }
}


function setLoading(loading) {
    isLoading = loading;

    if (loadBtn) {
        loadBtn.disabled = loading;
        loadBtn.textContent = loading ? "Loading..." : "Explore holidays";
    }
}

/* ============================================
   PART 2: LOAD COUNTRIES AND HOLIDAYS
   ============================================ */

/* 4. LOAD COUNTRIES */

async function loadCountries() {
    if (!countrySelect) {
        console.error("Country selector #countrySelect was not found.");
        return;
    }

    countrySelect.innerHTML =
        '<option value="">Loading countries...</option>';

    try {
        const response = await fetch("/api/countries");

        if (!response.ok) {
            throw new Error("Could not load countries from the server.");
        }

        const result = await response.json();

        // Expected response:
        // { success: true, countries: [{ countryCode: "IN", name: "India" }] }

        if (Array.isArray(result)) {
            allCountries = result;
        } else {
            allCountries = result.countries || [];
        }

        allCountries = allCountries
            .filter(country => country.countryCode && country.name)
            .sort((a, b) => a.name.localeCompare(b.name));

        if (allCountries.length === 0) {
            throw new Error("The server returned no countries.");
        }

        countrySelect.innerHTML = allCountries.map(country => {
            return `
                <option value="${escapeHTML(country.countryCode)}">
                    ${escapeHTML(country.name)}
                </option>
            `;
        }).join("");

        // Select India by default when available.

        const india = allCountries.find(
            country => country.countryCode === "IN"
        );

        countrySelect.value = india
            ? "IN"
            : allCountries[0].countryCode;

        selectedCountry = countrySelect.value;

    } catch (error) {
        console.error("Country loading error:", error);

        countrySelect.innerHTML =
            '<option value="">Countries unavailable</option>';

        showStatus(
            "Unable to load countries. Check that your backend is running.",
            "error"
        );
    }
}


/* 5. INITIALIZE YEAR SELECTOR */

function initializeYearSelector() {
    if (!yearSelect) {
        return;
    }

    const currentYear = new Date().getFullYear();

    // Preserve year options already included in index.html.

    if (yearSelect.options.length === 0) {
        for (
            let year = currentYear - 2;
            year <= currentYear + 5;
            year++
        ) {
            const option = document.createElement("option");

            option.value = String(year);
            option.textContent = String(year);

            yearSelect.appendChild(option);
        }
    }

    // Make sure the current year is available.

    const currentYearExists = Array.from(yearSelect.options).some(
        option => Number(option.value) === currentYear
    );

    if (!currentYearExists) {
        const option = document.createElement("option");

        option.value = String(currentYear);
        option.textContent = String(currentYear);

        yearSelect.appendChild(option);
    }

    yearSelect.value = String(currentYear);
    selectedYear = currentYear;
}


/* 6. FETCH HOLIDAYS FROM EXPRESS BACKEND */

async function loadHolidays() {
    if (isLoading) {
        return;
    }

    if (!countrySelect || !yearSelect) {
        showStatus(
            "The country or year selector is missing from index.html.",
            "error"
        );
        return;
    }

    selectedCountry = countrySelect.value;
    selectedYear = Number(yearSelect.value);

    if (!selectedCountry || !selectedYear) {
        showStatus("Please select a country and year.", "error");
        return;
    }

    setLoading(true);
    hideStatus();

    if (calendarGrid) {
        calendarGrid.innerHTML = `
            <div class="calendar-loading">
                Loading your holiday calendar...
            </div>
        `;
    }

    if (holidayTableBody) {
        holidayTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="table-empty">
                    Loading holidays...
                </td>
            </tr>
        `;
    }

    try {
        const url =
            `/api/holidays?year=${encodeURIComponent(selectedYear)}` +
            `&country=${encodeURIComponent(selectedCountry)}`;

        const response = await fetch(url);

        if (!response.ok) {
            let message = "Unable to load holidays.";

            try {
                const errorResult = await response.json();

                message =
                    errorResult.message ||
                    errorResult.error ||
                    message;
            } catch {
                // Use the default message if the error isn't JSON.
            }

            throw new Error(message);
        }

        const result = await response.json();

        // Accept either an array or { holidays: [...] }.

        if (Array.isArray(result)) {
            allHolidays = result;
        } else {
            allHolidays = result.holidays || [];
        }

        // Remove invalid dates and sort chronologically.

        allHolidays = allHolidays
            .filter(holiday => parseHolidayDate(holiday.date))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Reset search and month filters for the new selection.

        if (searchInput) {
            searchInput.value = "";
        }

        if (monthSelect) {
            monthSelect.value = "all";
        }

        selectedMonth = "all";

        // These functions will be added in Parts 3–5.

        updateStatistics();
        renderCalendar();
        applyFilters();

        showStatus(
            `Loaded ${allHolidays.length} holidays for ` +
            `${getCountryName(selectedCountry)} in ${selectedYear}.`,
            "success"
        );

    } catch (error) {
        console.error("Holiday loading error:", error);

        allHolidays = [];
        filteredHolidays = [];

        updateStatistics();
        renderCalendar();
        renderHolidayTable([]);

        showStatus(
            `${error.message} Make sure your Express server is running on port 5000.`,
            "error"
        );

    } finally {
        setLoading(false);
    }
}

/* LIVE HOLIDAY COUNTDOWN */

function updateHolidayCountdown(holiday) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    const timerElements = [
        countdownDaysEl,
        countdownHoursEl,
        countdownMinutesEl,
        countdownSecondsEl
    ];

    function resetTimer() {
        timerElements.forEach(element => {
            if (element) element.textContent = "00";
        });
    }

    if (!holiday) {
        if (countdownHolidayNameEl) {
            countdownHolidayNameEl.textContent =
                "No upcoming holidays";
        }

        if (countdownHolidayDateEl) {
            countdownHolidayDateEl.textContent =
                "Try another country or year.";
        }

        resetTimer();
        return;
    }

    const holidayName =
        holiday.localName ||
        holiday.name ||
        "Upcoming Holiday";

    const targetDate = parseHolidayDate(holiday.date);

    if (!targetDate) {
        resetTimer();
        return;
    }

    if (countdownHolidayNameEl) {
        countdownHolidayNameEl.textContent = holidayName;
    }

    if (countdownHolidayDateEl) {
        countdownHolidayDateEl.textContent =
            formatDate(holiday.date, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }

    targetDate.setHours(0, 0, 0, 0);

    function updateTimer() {
        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();

        if (difference <= 0) {
            resetTimer();

            if (countdownHolidayDateEl) {
                countdownHolidayDateEl.textContent =
                    "It's celebration time! Enjoy your holiday 🎉";
            }

            clearInterval(countdownInterval);
            countdownInterval = null;
            return;
        }

        const days = Math.floor(
            difference / (1000 * 60 * 60 * 24)
        );

        const hours = Math.floor(
            (difference / (1000 * 60 * 60)) % 24
        );

        const minutes = Math.floor(
            (difference / (1000 * 60)) % 60
        );

        const seconds = Math.floor(
            (difference / 1000) % 60
        );

        if (countdownDaysEl) {
            countdownDaysEl.textContent =
                String(days).padStart(2, "0");
        }

        if (countdownHoursEl) {
            countdownHoursEl.textContent =
                String(hours).padStart(2, "0");
        }

        if (countdownMinutesEl) {
            countdownMinutesEl.textContent =
                String(minutes).padStart(2, "0");
        }

        if (countdownSecondsEl) {
            countdownSecondsEl.textContent =
                String(seconds).padStart(2, "0");
        }
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

/* ============================================
   PART 3: DASHBOARD STATISTICS AND CALENDAR
   ============================================ */

/* 7. UPDATE DASHBOARD STATISTICS */

function updateStatistics() {
    // Total number of holidays.

    if (totalHolidaysEl) {
        totalHolidaysEl.textContent = allHolidays.length;
    }

    // Number of nationwide holidays.

    const nationwideCount = allHolidays.filter(
        holiday => holiday.global === true
    ).length;

    if (nationwideHolidaysEl) {
        nationwideHolidaysEl.textContent = nationwideCount;
    }

    // Count the months that contain holidays.

    const activeMonthNumbers = new Set(
        allHolidays.map(holiday => holiday.date.slice(5, 7))
    );

    if (activeMonthsEl) {
        activeMonthsEl.textContent = activeMonthNumbers.size;
    }

    // Find the next upcoming holiday, including today.

    const today = localDateString(new Date());

    const upcomingHoliday = allHolidays.find(
        holiday => holiday.date >= today
    );
    updateHolidayCountdown(upcomingHoliday);

    if (nextHolidayEl) {
        nextHolidayEl.textContent = upcomingHoliday
            ? (
                upcomingHoliday.localName ||
                upcomingHoliday.name ||
                "Upcoming holiday"
            )
            : "No upcoming holidays";
    }

    if (nextHolidayDateEl) {
        nextHolidayDateEl.textContent = upcomingHoliday
            ? formatDate(upcomingHoliday.date, {
                weekday: "short",
                day: "numeric",
                month: "short"
            })
            : "You're all caught up!";
    }
}


/* 8. GENERATE THE YEARLY HOLIDAY CALENDAR */

function renderCalendar() {
    if (!calendarGrid) {
        console.error("Calendar container #calendarGrid was not found.");
        return;
    }

    if (allHolidays.length === 0) {
        calendarGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No holidays found</h3>
                <p>Try selecting another country or year.</p>
            </div>
        `;

        return;
    }

    // Group holidays by their date.

    const holidaysByDate = {};

    allHolidays.forEach(holiday => {
        if (!holidaysByDate[holiday.date]) {
            holidaysByDate[holiday.date] = [];
        }

        holidaysByDate[holiday.date].push(holiday);
    });

    const today = localDateString(new Date());

    // Weekday headings: Monday to Sunday.

    const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

    let calendarHTML = "";

    // Create all 12 months.

    for (let month = 0; month < 12; month++) {
        const firstDay = new Date(selectedYear, month, 1);

        const daysInMonth = new Date(
            selectedYear,
            month + 1,
            0
        ).getDate();

        // Convert Sunday-first indexing to Monday-first indexing.

        const startingDay = (firstDay.getDay() + 6) % 7;

        const monthHolidays = allHolidays.filter(holiday => {
            const date = parseHolidayDate(holiday.date);

            return date &&
                date.getFullYear() === selectedYear &&
                date.getMonth() === month;
        });

        let daysHTML = "";

        // Empty cells before the first day.

        for (let blank = 0; blank < startingDay; blank++) {
            daysHTML += `
                <div class="day-cell empty" aria-hidden="true"></div>
            `;
        }

        // Create each day in the month.

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString =
                `${selectedYear}-` +
                `${String(month + 1).padStart(2, "0")}-` +
                `${String(day).padStart(2, "0")}`;

            const dayHolidays = holidaysByDate[dateString] || [];

            const isToday = dateString === today;
            const isWeekend =
                new Date(selectedYear, month, day).getDay() === 0 ||
                new Date(selectedYear, month, day).getDay() === 6;

            const isHoliday = dayHolidays.length > 0;
            const isUpcoming = isHoliday && dateString >= today;

            // Build CSS classes for each day.

            const classes = ["day-cell"];

            if (isToday) classes.push("is-today");
            if (isWeekend) classes.push("is-weekend");
            if (isHoliday) classes.push("is-holiday");
            if (isUpcoming) classes.push("is-upcoming");

            const holidayNames = dayHolidays.map(holiday =>
                holiday.localName || holiday.name || "Public holiday"
            );

            const holidayLabel = holidayNames.join(", ");

            if (isHoliday) {
                daysHTML += `
                    <button
                        type="button"
                        class="${classes.join(" ")}"
                        data-date="${dateString}"
                        data-holiday-name="${escapeHTML(holidayLabel)}"
                        title="${escapeHTML(holidayLabel)}"
                        aria-label="${escapeHTML(
                            `${formatDate(dateString)}, ${holidayLabel}`
                        )}"
                    >
                        <span>${day}</span>
                        <span class="holiday-dot"></span>
                    </button>
                `;
            } else {
                daysHTML += `
                    <div
                        class="${classes.join(" ")}"
                        ${isToday ? 'aria-label="Today"' : ""}
                    >
                        <span>${day}</span>
                    </div>
                `;
            }
        }

        // Finish this month's card.

        calendarHTML += `
            <section class="month-card" data-month="${month}">
                <div class="month-header">
                    <h3 class="month-title">
                        ${getMonthName(month)}
                    </h3>

                    <span class="month-holiday-count">
                        ${monthHolidays.length}
                        ${monthHolidays.length === 1 ? "holiday" : "holidays"}
                    </span>
                </div>

                <div class="month-weekdays">
                    ${weekdays.map(day => `
                        <span>${day}</span>
                    `).join("")}
                </div>

                <div class="month-days">
                    ${daysHTML}
                </div>
            </section>
        `;
    }

    calendarGrid.innerHTML = calendarHTML;

    // Clicking a holiday date searches for that holiday in the directory.

    calendarGrid.querySelectorAll(
        ".day-cell.is-holiday[data-holiday-name]"
    ).forEach(dayButton => {
        dayButton.addEventListener("click", () => {
            const holidayName = dayButton.dataset.holidayName || "";

            if (searchInput) {
                searchInput.value = holidayName.split(", ")[0];
            }

            applyFilters();

            const directorySection =
                document.querySelector(".directory-section") ||
                document.getElementById("holiday-directory") ||
                holidayTableBody;

            if (directorySection) {
                directorySection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    // Apply the currently selected month filter.

    applyMonthFilter();
}

/* ============================================
   PART 4: FILTERS, SEARCH AND HOLIDAY DIRECTORY
   ============================================ */

/* 9. FILTER THE CALENDAR BY MONTH */

function applyMonthFilter() {
    if (!calendarGrid) {
        return;
    }

    const monthCards = calendarGrid.querySelectorAll(".month-card");

    monthCards.forEach(card => {
        const cardMonth = card.dataset.month;

        const shouldShow =
            selectedMonth === "all" ||
            Number(cardMonth) === Number(selectedMonth);

        card.hidden = !shouldShow;
    });
}


/* 10. SEARCH AND FILTER HOLIDAYS */

function applyFilters() {
    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    selectedMonth = monthSelect
        ? monthSelect.value
        : "all";

    filteredHolidays = allHolidays.filter(holiday => {
        // Match the selected month.

        const holidayMonth = holiday.date.slice(5, 7);

        const matchesMonth =
            selectedMonth === "all" ||
            Number(holidayMonth) === Number(selectedMonth) + 1;

        // Search holiday name, date, country-independent details and type.

        const searchableText = [
            holiday.name,
            holiday.localName,
            holiday.date,
            formatDate(holiday.date),
            ...(Array.isArray(holiday.types) ? holiday.types : [])
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            searchableText.includes(searchTerm);

        return matchesMonth && matchesSearch;
    });

    applyMonthFilter();
    renderHolidayTable(filteredHolidays);
    updateResultCount(filteredHolidays.length);
}


/* 11. DISPLAY FILTERED HOLIDAYS IN THE TABLE */

function renderHolidayTable(holidays) {
    if (!holidayTableBody) {
        console.error(
            "Holiday table body #holidayTableBody was not found."
        );
        return;
    }

    if (!holidays || holidays.length === 0) {
        holidayTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="table-empty">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔎</div>
                        <h3>No holidays found</h3>
                        <p>
                            Try another search term, month,
                            country or year.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    holidayTableBody.innerHTML = holidays.map(holiday => {
        const date = parseHolidayDate(holiday.date);

        const weekday = date
            ? date.toLocaleDateString("en-IN", {
                weekday: "short"
            })
            : "—";

        const holidayName =
            holiday.localName ||
            holiday.name ||
            "Unnamed holiday";

        const types = Array.isArray(holiday.types)
            ? holiday.types
            : [];

        const typeBadges = holiday.global
            ? '<span class="type-badge public">Nationwide</span>'
            : types.length > 0
                ? types.map(type => `
                    <span class="type-badge">
                        ${escapeHTML(type)}
                    </span>
                `).join(" ")
                : '<span class="type-badge">Public holiday</span>';

        // Regional information may not be supplied by the API.

        const locationLabel = holiday.global
            ? "Nationwide"
            : Array.isArray(holiday.counties) &&
              holiday.counties.length > 0
                ? `${holiday.counties.length} regions`
                : "Regional details unavailable";

        return `
            <tr>
                <td>
                    <span class="table-date">
                        ${escapeHTML(formatDate(holiday.date))}
                    </span>
                </td>

                <td>
                    <span class="table-weekday">
                        ${escapeHTML(weekday)}
                    </span>
                </td>

                <td>
                    <div class="holiday-name">
                        ${escapeHTML(holidayName)}
                    </div>

                    ${
                        holiday.name &&
                        holiday.localName &&
                        holiday.name !== holiday.localName
                            ? `
                                <div class="holiday-subtitle">
                                    ${escapeHTML(holiday.name)}
                                </div>
                            `
                            : ""
                    }
                </td>

                <td>
                    <div class="holiday-types">
                        ${typeBadges}
                    </div>

                    <div class="holiday-location">
                        ${escapeHTML(locationLabel)}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

/* ============================================
   PART 5: RESULT COUNTER AND CSV EXPORT
   ============================================ */

/* 12. UPDATE THE RESULT COUNTER */

function updateResultCount(count) {
    if (resultCountEl) {
        resultCountEl.textContent =
            `${count} ${count === 1 ? "holiday" : "holidays"} found`;
        return;
    }

    // Fallback if the HTML uses a different result-count element.

    const resultCount = document.querySelector(".result-count");

    if (resultCount) {
        resultCount.textContent =
            `${count} ${count === 1 ? "holiday" : "holidays"} found`;
    }
}


/* 13. FORMAT VALUES FOR CSV */

function escapeCSV(value) {
    const text = String(value ?? "");

    // Double any quotation marks and wrap the value in quotes.

    return `"${text.replace(/"/g, '""')}"`;
}


/* 14. EXPORT FILTERED HOLIDAYS TO CSV */

function exportHolidays() {
    if (!filteredHolidays || filteredHolidays.length === 0) {
        showStatus(
            "No holidays available to export. Try changing your search or filters.",
            "error"
        );

        return;
    }

    const headers = [
        "Date",
        "Day",
        "Holiday Name",
        "Local Name",
        "Country",
        "Nationwide",
        "Types"
    ];

    const rows = filteredHolidays.map(holiday => {
        const date = parseHolidayDate(holiday.date);

        const weekday = date
            ? date.toLocaleDateString("en-IN", {
                weekday: "long"
            })
            : "";

        const types = Array.isArray(holiday.types)
            ? holiday.types.join(", ")
            : "";

        return [
            holiday.date,
            weekday,
            holiday.name || "",
            holiday.localName || "",
            getCountryName(selectedCountry),
            holiday.global ? "Yes" : "No",
            types
        ];
    });

    // Add a UTF-8 BOM to help spreadsheet applications read the file.

    const csvContent = "\uFEFF" + [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const downloadURL = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadURL;
    link.download =
        `holiwise-${selectedCountry}-${selectedYear}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadURL);

    showStatus(
        `Successfully exported ${filteredHolidays.length} holidays to CSV.`,
        "success"
    );
}

/* ============================================
   PART 6: EVENT LISTENERS AND INITIALIZATION
   ============================================ */

/* 15. REGISTER EVENT LISTENERS */

// Load holidays when the Explore button is clicked.

if (loadBtn) {
    loadBtn.addEventListener("click", loadHolidays);
}

// Update the selected country when it changes.

if (countrySelect) {
    countrySelect.addEventListener("change", () => {
        selectedCountry = countrySelect.value;
    });
}

// Update the selected year when it changes.

if (yearSelect) {
    yearSelect.addEventListener("change", () => {
        selectedYear = Number(yearSelect.value);
    });
}

// Filter holidays when the month changes.

if (monthSelect) {
    monthSelect.addEventListener("change", () => {
        selectedMonth = monthSelect.value;
        applyFilters();
    });
}

// Search automatically as the user types.

if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
}

// Export the filtered holiday list.

if (exportBtn) {
    exportBtn.addEventListener("click", exportHolidays);
}


/* 16. INITIALIZE HOLIWISE */

async function initializeHoliwise() {
    console.log("🌍 Holiwise is starting...");

    initializeYearSelector();

    await loadCountries();

    if (selectedCountry) {
        await loadHolidays();
    } else {
        showStatus(
            "Unable to initialize countries. Please check your backend.",
            "error"
        );
    }

    console.log("✨ Holiwise initialization finished.");
}


/* 17. START AFTER THE HTML HAS LOADED */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeHoliwise
    );
} else {
    initializeHoliwise();
}

/* ==========================================
   HOLIWISE - HISTORY FEATURE
========================================== */

const HOLIWISE_HISTORY_KEY = "holiwiseSearchHistory";
const HOLIWISE_MAX_HISTORY = 30;

const searchHistoryList = document.getElementById("searchHistoryList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const celebrationSearch = document.getElementById("celebrationSearch");
const celebrationHistoryList = document.getElementById("celebrationHistoryList");

/* Safely display text inside HTML */
function historyEscapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

/* Read saved searches */
function readSearchHistory() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(HOLIWISE_HISTORY_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Could not read search history:", error);
        return [];
    }
}

/* Save a search */
function saveHoliwiseSearchHistory(searchTerm = "") {
    const countryElement = document.getElementById("countrySelect");
    const yearElement = document.getElementById("yearSelect");

    if (!countryElement || !yearElement || !countryElement.value) {
        return;
    }

    const countryCode = countryElement.value;

    const selectedOption =
    countryElement.options[countryElement.selectedIndex];

    const countryName = selectedOption
    ? selectedOption.textContent.trim()
    : countryCode;

    const year = yearElement.value;
    const term = String(searchTerm || "").trim();

    let history = readSearchHistory();

    history = history.filter(item =>
        !(
            item.country === countryCode &&
            String(item.year) === String(year) &&
            item.searchTerm === term
        )
    );

    history.unshift({
        country: countryCode,
        countryName,
        year,
        searchTerm: term,
        searchedAt: new Date().toISOString()
    });

    history = history.slice(0, HOLIWISE_MAX_HISTORY);

    try {
        localStorage.setItem(
            HOLIWISE_HISTORY_KEY,
            JSON.stringify(history)
        );
    } catch (error) {
        console.error("Could not save search history:", error);
    }

    renderHoliwiseSearchHistory();
}

/* Render saved searches */
function renderHoliwiseSearchHistory() {
    if (!searchHistoryList) return;

    const history = readSearchHistory();

    if (history.length === 0) {
        searchHistoryList.innerHTML = `
            <div class="history-empty">
                <div class="history-empty-icon">🔍</div>
                <h3>No search history yet</h3>
                <p>Choose a country and year, then explore holidays.
                Your recent searches will appear here.</p>
            </div>
        `;
        return;
    }

    searchHistoryList.innerHTML = history.map((item, index) => {
         
        const searchedDate = item.searchedAt
    ? new Date(item.searchedAt).toLocaleDateString()
    : "Previously searched";

const searchedTime = item.searchedAt
    ? new Date(item.searchedAt).toLocaleTimeString()
    : "";
        return `
            <article class="search-history-item">
                <div class="history-item-top">
                    <div class="history-item-icon">🌍
                </div>
                    <div 
                class="history-item-details">
                    <h3 
                class="history-item-title">
                ${historyEscapeHTML(item.countryName || item.country || "Unknown Country")}
                    </h3>

                <div class="history-item-meta">
                    Country: ${historyEscapeHTML(item.countryName || item.country || "Unknown Country")}<br>
    Year: ${historyEscapeHTML(item.year)}<br>
    Date: ${historyEscapeHTML(searchedDate)}<br>
    Time: ${historyEscapeHTML(searchedTime)}
</div>
                    </div>
                </div>
                ${
                    item.searchTerm
                        ? `<p class="history-item-meta">Search: ${historyEscapeHTML(item.searchTerm)}</p>`
                        : ""
                }
                <button
                    type="button"
                    class="history-revisit-btn"
                    data-revisit-history="${index}">
                    ↻ Revisit Search
                </button>
            </article>
        `;
    }).join("");
}

/* Revisit a previous search */
if (searchHistoryList) {
    searchHistoryList.addEventListener("click", async event => {
        const button = event.target.closest("[data-revisit-history]");
        if (!button) return;

        const index = Number(button.dataset.revisitHistory);
        const item = readSearchHistory()[index];

        if (!item) return;

        const countryElement = document.getElementById("countrySelect");
        const yearElement = document.getElementById("yearSelect");
        const searchInput = document.getElementById("searchInput");

        if (!countryElement || !yearElement) return;

        countryElement.value = item.country;
        yearElement.value = String(item.year);

        countryElement.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        yearElement.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        if (searchInput) {
            searchInput.value = item.searchTerm || "";
        }

        const loadButton = document.getElementById("loadBtn");

        if (loadButton) {
            loadButton.click();
        } else {
            console.warn("Holiday load button was not found.");
        }

        document.getElementById("directory")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

/* Clear saved searches */
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
        const confirmed = confirm(
            "Are you sure you want to clear all your search history?"
        );

        if (!confirmed) return;

        localStorage.removeItem(HOLIWISE_HISTORY_KEY);
        renderHoliwiseSearchHistory();
    });
}

/* Worldwide festival and celebration information */
const holiwiseCelebrations = [
    {
        name: "Pongal",
        icon: "🌾",
        country: "India",
        origin: "Tamil Nadu, India",
        description: "A harvest festival celebrating the Sun, nature, cattle, and farmers through traditional food and family gatherings."
    },
    {
        name: "Diwali",
        icon: "🪔",
        country: "India",
        origin: "India",
        description: "The Festival of Lights celebrates hope, prosperity, and the victory of light over darkness."
    },
    {
        name: "Holi",
        icon: "🎨",
        country: "India",
        origin: "India",
        description: "The Festival of Colours welcomes spring and celebrates joy, community, and the triumph of good over evil."
    },
    {
        name: "Onam",
        icon: "🌼",
        country: "India",
        origin: "Kerala, India",
        description: "A harvest festival associated with King Mahabali, celebrated with floral decorations, traditional feasts, and cultural events."
    },
    {
        name: "Independence Day",
        icon: "🇮🇳",
        country: "India",
        origin: "India",
        description: "Observed on 15 August to commemorate India's independence in 1947."
    },
    {
        name: "Republic Day",
        icon: "🇮🇳",
        country: "India",
        origin: "India",
        description: "Observed on 26 January to mark the Constitution of India taking effect in 1950."
    },
    {
        name: "Thanksgiving",
        icon: "🦃",
        country: "United States",
        origin: "United States",
        description: "A holiday centred on gratitude, meals, and family gatherings."
    },
    {
        name: "Independence Day",
        icon: "🎆",
        country: "United States",
        origin: "United States",
        description: "Celebrated on 4 July to commemorate the adoption of the Declaration of Independence in 1776."
    },
    {
        name: "Martin Luther King Jr. Day",
        icon: "🕊️",
        country: "United States",
        origin: "United States",
        description: "Honours Martin Luther King Jr. and his leadership in the American civil rights movement."
    },
    {
        name: "Boxing Day",
        icon: "🎁",
        country: "United Kingdom",
        origin: "United Kingdom",
        description: "Observed on 26 December, with traditions including family visits, sports, and post-Christmas gatherings."
    },
    {
        name: "Bonfire Night",
        icon: "🔥",
        country: "United Kingdom",
        origin: "United Kingdom",
        description: "Observed on 5 November with bonfires and fireworks, commemorating the failure of the Gunpowder Plot of 1605."
    },
    {
        name: "Golden Week",
        icon: "🌸",
        country: "Japan",
        origin: "Japan",
        description: "A series of Japanese public holidays in late April and early May, often used for travel and family activities."
    },
    {
        name: "Culture Day",
        icon: "🎎",
        country: "Japan",
        origin: "Japan",
        description: "Observed on 3 November to celebrate culture, arts, and academic achievement."
    },
    {
        name: "Chinese New Year",
        icon: "🧧",
        country: "China",
        origin: "China",
        description: "Lunar New Year celebrations include family reunions, traditional foods, decorations, and wishes for good fortune."
    },
    {
        name: "Mid-Autumn Festival",
        icon: "🏮",
        country: "China",
        origin: "China",
        description: "A harvest celebration associated with the full moon, family reunions, lanterns, and mooncakes."
    },
    {
        name: "Bastille Day",
        icon: "🇫🇷",
        country: "France",
        origin: "France",
        description: "France's national day on 14 July, marked by public celebrations and commemorations of the French Revolution."
    },
    {
        name: "Carnival",
        icon: "🥁",
        country: "Brazil",
        origin: "Brazil",
        description: "A lively festival season famous for samba, music, costumes, parades, and street celebrations."
    },
    {
        name: "Day of the Dead",
        icon: "💀",
        country: "Mexico",
        origin: "Mexico",
        description: "A Mexican tradition honouring deceased loved ones through altars, flowers, photographs, food, and remembrance."
    },
    {
        name: "Australia Day",
        icon: "🇦🇺",
        country: "Australia",
        origin: "Australia",
        description: "Observed on 26 January, with events and reflection on Australia's history and its First Peoples."
    },
    {
        name: "Songkran",
        icon: "💦",
        country: "Thailand",
        origin: "Thailand",
        description: "The traditional Thai New Year festival, celebrated in April with water traditions, family visits, and temple activities."
    },
    {
        name: "Christmas",
        icon: "🎄",
        country: "Worldwide",
        origin: "Celebrated in many countries",
        description: "A Christian festival celebrating the birth of Jesus Christ, often marked by services, gifts, decorations, and gatherings."
    },
    {
        name: "New Year's Day",
        icon: "🎆",
        country: "Worldwide",
        origin: "Celebrated worldwide",
        description: "Welcomes the new calendar year with reflection, fresh goals, gatherings, and celebrations."
    },
    {
        name: "Eid al-Fitr",
        icon: "🌙",
        country: "Worldwide",
        origin: "Muslim communities worldwide",
        description: "Marks the end of Ramadan with prayers, festive meals, charity, and time with family and community."
    },
    {
        name: "Eid al-Adha",
        icon: "✨",
        country: "Worldwide",
        origin: "Muslim communities worldwide",
        description: "A significant Islamic festival centred on faith, generosity, sacrifice, and sharing with people in need."
    },
    {
        name: "Buddha Purnima",
        icon: "🪷",
        country: "Worldwide",
        origin: "Buddhist communities",
        description: "Honours Gautama Buddha's life and teachings through traditions that may include meditation, prayer, and generosity."
    }
];

/* Render celebrations with search and country filtering */
function renderHoliwiseCelebrations(searchTerm = "") {
    if (!celebrationHistoryList) return;

    const term = String(searchTerm).trim().toLowerCase();

    const countryFilter =
        document.getElementById("celebrationCountryFilter")?.value || "all";

    const filtered = holiwiseCelebrations.filter(festival => {
        const searchableText =
            `${festival.name} ${festival.country} ${festival.origin} ${festival.description}`
                .toLowerCase();

        const matchesSearch = searchableText.includes(term);

        const matchesCountry =
            countryFilter === "all" ||
            festival.country === countryFilter;

        return matchesSearch && matchesCountry;
    });

    if (filtered.length === 0) {
        celebrationHistoryList.innerHTML = `
            <div class="history-empty">
                <div class="history-empty-icon">🌍</div>
                <h3>No celebrations found</h3>
                <p>Try another search term or choose a different country.</p>
            </div>
        `;
        return;
    }

    celebrationHistoryList.innerHTML = filtered.map(festival => `
        <article class="celebration-history-card">
            <div class="celebration-icon">${festival.icon}</div>
            <h3>${historyEscapeHTML(festival.name)}</h3>
            <span class="celebration-origin">
                ${historyEscapeHTML(festival.origin)}
            </span>
            <p>${historyEscapeHTML(festival.description)}</p>
        </article>
    `).join("");
}

/* Switch between History tabs */
document.querySelectorAll("[data-history-tab]").forEach(button => {
    button.addEventListener("click", () => {
        const selectedTab = button.dataset.historyTab;

        document.querySelectorAll("[data-history-tab]").forEach(tab => {
            const isActive = tab === button;
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
        });

        const searchContent = document.getElementById("search-history-content");
        const celebrationContent = document.getElementById("celebration-history-content");

        if (searchContent) {
            searchContent.hidden = selectedTab !== "search";
        }

        if (celebrationContent) {
            celebrationContent.hidden = selectedTab !== "celebrations";
        }
    });
});

/* Search celebrations */
if (celebrationSearch) {
    celebrationSearch.addEventListener("input", () => {
        renderHoliwiseCelebrations(celebrationSearch.value);
    });
}

/* Filter celebrations by country */
const celebrationCountryFilter =
    document.getElementById("celebrationCountryFilter");

if (celebrationCountryFilter) {
    celebrationCountryFilter.addEventListener("change", () => {
        renderHoliwiseCelebrations(
            celebrationSearch?.value || ""
        );
    });
}

/* Connect history saving to the existing Explore button */
const holiwiseExploreButton = document.getElementById("loadBtn");

if (holiwiseExploreButton) {
    holiwiseExploreButton.addEventListener("click", () => {
        saveHoliwiseSearchHistory(
            document.getElementById("searchInput")?.value || ""
        );
    });
}

/* Also save when the user presses Enter in the search field */
const holiwiseSearchInput = document.getElementById("searchInput");

if (holiwiseSearchInput) {
    holiwiseSearchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            saveHoliwiseSearchHistory(holiwiseSearchInput.value);
        }
    });
}

/* Initial display */
renderHoliwiseSearchHistory();
renderHoliwiseCelebrations();