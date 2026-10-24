const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const API_BASE = "https://date.nager.at/api/v3";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Cache API responses for one hour
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchWithCache(url) {
    const cached = cache.get(url);

    if (cached && Date.now() - cached.time < CACHE_DURATION) {
        return cached.data;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Holiday API returned status ${response.status}`);
    }

    const data = await response.json();
    cache.set(url, { data, time: Date.now() });

    return data;
}

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Holiwise backend is running!"
    });
});

// Get all supported countries
app.get("/api/countries", async (req, res) => {
    try {
        const countries = await fetchWithCache(
            `${API_BASE}/AvailableCountries`
        );

        res.json({
            success: true,
            total: countries.length,
            countries
        });
    } catch (error) {
        console.error("Countries error:", error.message);
        res.status(502).json({
            success: false,
            message: "Unable to load countries. Please try again."
        });
    }
});

// Get public holidays for a selected country and year
app.get("/api/holidays", async (req, res) => {
    const year = Number(req.query.year);
    const country = String(req.query.country || "").toUpperCase();

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid year between 1900 and 2100."
        });
    }

    if (!/^[A-Z]{2}$/.test(country)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid two-letter country code."
        });
    }

    try {
        const countries = await fetchWithCache(
            `${API_BASE}/AvailableCountries`
        );

        const supportedCountry = countries.find(
            item => item.countryCode === country
        );

        if (!supportedCountry) {
            return res.status(400).json({
                success: false,
                message: "This country is not supported by the API."
            });
        }

        const url = `${API_BASE}/PublicHolidays/${year}/${country}`;
        const data = await fetchWithCache(url);

        const holidays = data
            .map(holiday => ({
                date: holiday.date,
                name: holiday.name || holiday.localName || "Public Holiday",
                localName: holiday.localName || holiday.name || "Public Holiday",
                countryCode: holiday.countryCode,
                global: Boolean(holiday.global),
                counties: holiday.counties || [],
                types: holiday.types || []
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            success: true,
            country: supportedCountry.name,
            countryCode: country,
            year,
            total: holidays.length,
            holidays
        });
    } catch (error) {
        console.error("Holidays error:", error.message);
        res.status(502).json({
            success: false,
            message: "Unable to load holidays. Please try again."
        });
    }
});

// Serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🎉 Holiwise is running at http://localhost:${PORT}`);
});