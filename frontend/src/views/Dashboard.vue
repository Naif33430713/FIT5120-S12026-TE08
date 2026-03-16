<script setup>

import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue"
import { RouterLink } from "vue-router"
import api from "../services/api"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// fix broken default marker icon paths when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
})

const uvData = ref(null)
const error = ref(null)
const loading = ref(false)

const city = ref("")
const locationName = ref("")
const geoMatches = ref([])
const searchSuggestions = ref([])
const isSearchingCity = ref(false)
const selectedLat = ref(null)
const selectedLon = ref(null)

let leafletMap = null
let leafletMarker = null

let reminderTimer = null
let countdownTimer = null
const reminderEnabled = ref(false)
const showProtection = ref(false)
const testMode = ref(false)
const reminderFired = ref(false)
const showEmptySearchPopup = ref(false)
const showSuccessPopup = ref(false)
const nextFireTime = ref(null)
const countdownDisplay = ref("")
const reminderIntervalMinutesKey = "sunscreenReminderIntervalMinutes"
const reminderEnabledKey = "sunscreenReminderEnabled"

let successPopupTimer = null
let searchDebounceTimer = null
let suppressSuggestions = false

/*
-------------------------------------
UV COLOR & WARNING LOGIC
-------------------------------------
*/

function getUVColor(index) {
  const value = Number(index ?? 0)

  if (value <= 2) return "#22c55e" // green
  if (value <= 5) return "#eab308" // yellow
  if (value <= 7) return "#f97316" // orange
  if (value <= 10) return "#ef4444" // red

  return "#a855f7" // purple
}

function getUvWarning(uvIndex, minutes) {
  const value = Number(uvIndex ?? 0)
  const mins = Number(minutes ?? 0)

  if (value <= 2) {
    return "Minimal risk. No protection required unless outside for extended periods or near reflective surfaces (snow/water)."
  }

  if (value <= 5) {
    return "Moderate risk. Seek shade, wear clothing, hat, and sunglasses, and apply SPF 50+ sunscreen."
  }

  if (value <= 7) {
    return "High risk. Same as moderate, but take extra care, especially between 10 am and 4 pm."
  }

  if (value <= 10) {
    return "Very high risk. Avoid sun between 10 am and 4 pm, use all protection measures."
  }

  return "Extreme risk. Take all precautions. Unprotected skin burns in minutes."
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex).replace("#", "")
  if (normalized.length !== 6) return `rgba(0, 0, 0, ${alpha})`

  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getUvMessageStyle(uvIndex) {
  const base = getUVColor(uvIndex)

  return {
    borderColor: base,
    backgroundColor: hexToRgba(base, 0.12),
    color: "#111827"
  }
}

function getClothingEmojis(uvIndex) {
  const value = Number(uvIndex ?? 0)

  if (value <= 2) return "👒"
  if (value <= 5) return "👒 🕶️ 👕"
  if (value <= 7) return "👒 🕶️ 👕 🧥"
  if (value <= 10) return "👒 🕶️ 👕 🧥 ⛱️"

  return "👒 🕶️ 👕 🧥 ⛱️ 🏠"
}

function getSunscreenEmojis(uvIndex) {
  const value = Number(uvIndex ?? 0)

  if (value <= 2) return "🧴"
  if (value <= 5) return "🧴 ✅"
  if (value <= 7) return "🧴 ✅ 🔁"
  if (value <= 10) return "🧴 ✅ 🔁 ⚠️"

  return "🧴 ✅ 🔁 ⚠️ 🚨"
}

function getWeatherEmoji(weatherId) {
  const id = Number(weatherId ?? 0)
  if (id >= 200 && id < 300) return "⛈️"
  if (id >= 300 && id < 400) return "🌧️"
  if (id >= 500 && id < 600) return "🌧️"
  if (id >= 600 && id < 700) return "❄️"
  if (id >= 700 && id < 800) return "🌫️"
  if (id === 800) return "☀️"
  if (id === 801) return "🌤️"
  if (id === 802) return "⛅"
  if (id === 803 || id === 804) return "☁️"
  return "☀️"
}

function formatLocalTime(unixSeconds, timezoneSeconds) {
  if (unixSeconds == null || timezoneSeconds == null) return ""
  // Local time of day at the location (seconds since midnight); avoid using Date so we don't use browser timezone
  const localTotalSeconds = unixSeconds + timezoneSeconds
  const secondsInDay = ((localTotalSeconds % 86400) + 86400) % 86400
  const hours = Math.floor(secondsInDay / 3600)
  const minutes = Math.floor((secondsInDay % 3600) / 60)
  const ampm = hours >= 12 ? "pm" : "am"
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`
}

function getCurrentUvLabel(uvIndex, riskLevel) {
  if (uvIndex == null || !riskLevel) {
    return "Current UV index information is not available"
  }
  return `Current UV index is:   ${riskLevel} Risk`
}

function formatLocalDate(timezoneSeconds) {
  if (timezoneSeconds == null) return ""
  const nowUtcSeconds = Math.floor(Date.now() / 1000)
  const localDate = new Date((nowUtcSeconds + timezoneSeconds) * 1000)
  return localDate.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

function formatForecastDay(dtUnix, timezoneSeconds) {
  if (dtUnix == null || timezoneSeconds == null) return ""
  const nowUtcSeconds = Math.floor(Date.now() / 1000)
  const localNow = new Date((nowUtcSeconds + timezoneSeconds) * 1000)
  const localDay = new Date((dtUnix + timezoneSeconds) * 1000)
  const todayDate = localNow.toISOString().slice(0, 10)
  const dayDate = localDay.toISOString().slice(0, 10)
  if (dayDate === todayDate) return "Today"
  const tomorrowUtc = new Date((nowUtcSeconds + timezoneSeconds + 86400) * 1000)
  const tomorrowDate = tomorrowUtc.toISOString().slice(0, 10)
  if (dayDate === tomorrowDate) return "Tomorrow"
  return localDay.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })
}

/*
-------------------------------------
RESET DASHBOARD STATE
-------------------------------------
*/

function resetDashboard() {
  city.value = ""
  locationName.value = ""
  geoMatches.value = []
  searchSuggestions.value = []
  uvData.value = null
  error.value = null
  loading.value = false
  showProtection.value = false
  showSuccessPopup.value = false
  selectedLat.value = null
  selectedLon.value = null

  if (successPopupTimer) {
    clearTimeout(successPopupTimer)
    successPopupTimer = null
  }

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }

  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
    leafletMarker = null
  }
}

/*
-------------------------------------
STOP REMINDER (shared cleanup)
-------------------------------------
*/

function stopReminder() {

  if (reminderTimer) {

    clearTimeout(reminderTimer)

    reminderTimer = null

  }

  if (countdownTimer) {

    clearInterval(countdownTimer)

    countdownTimer = null

  }

  nextFireTime.value = null

  countdownDisplay.value = ""

  reminderEnabled.value = false

  localStorage.removeItem(reminderEnabledKey)
  localStorage.removeItem(reminderIntervalMinutesKey)

}

/*
-------------------------------------
START REMINDER TIMER
-------------------------------------
*/

function startReminder(minutes) {

  if (!minutes) return

  const intervalMs = minutes * 60000

  stopReminder()

  reminderEnabled.value = true

  nextFireTime.value = Date.now() + intervalMs

  function updateCountdown() {

    if (!nextFireTime.value) return

    const remaining = Math.max(0, Math.floor((nextFireTime.value - Date.now()) / 1000))

    const m = Math.floor(remaining / 60)

    const s = remaining % 60

    countdownDisplay.value = `${m}:${String(s).padStart(2, "0")}`

  }

  updateCountdown()

  countdownTimer = setInterval(updateCountdown, 1000)

  reminderTimer = setTimeout(() => {

    reminderFired.value = true

    stopReminder()

  }, intervalMs)

}

/*
-------------------------------------
ENABLE REMINDER
-------------------------------------
*/

function enableReminder() {

  const interval = testMode.value ? 1 : 120

  reminderFired.value = false

  startReminder(interval)
  localStorage.setItem(reminderEnabledKey, "true")
  localStorage.setItem(reminderIntervalMinutesKey, String(interval))

}

/*
-------------------------------------
DISABLE REMINDER
-------------------------------------
*/
function disableReminder() {

  stopReminder()

  reminderFired.value = false

}

/*
-------------------------------------
FETCH UV DATA
-------------------------------------
*/

async function fetchUV(lat, lon) {

  loading.value = true
  error.value = null

  selectedLat.value = lat
  selectedLon.value = lon

  if (successPopupTimer) {
    clearTimeout(successPopupTimer)
    successPopupTimer = null
  }
  showSuccessPopup.value = true

  try {

    const res = await api.get(`/api/uv?lat=${lat}&lon=${lon}`)

    uvData.value = res.data

    successPopupTimer = setTimeout(() => {
      showSuccessPopup.value = false
      successPopupTimer = null
    }, 2000)

    await nextTick()
    initOrUpdateMap(lat, lon)

  } catch (err) {

    showSuccessPopup.value = false
    console.error(err)
    uvData.value = null
    error.value = err.response?.status === 400 && err.response?.data?.error
      ? err.response.data.error
      : "Failed to fetch UV data"

  }

  loading.value = false

}

function initOrUpdateMap(lat, lon) {

  const el = document.getElementById("location-map")
  if (!el) return

  if (leafletMap) {
    leafletMap.setView([lat, lon], 12)
    if (leafletMarker) {
      leafletMarker.setLatLng([lat, lon])
    } else {
      leafletMarker = L.marker([lat, lon]).addTo(leafletMap)
    }
    return
  }

  leafletMap = L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lon], 12)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(leafletMap)

  leafletMarker = L.marker([lat, lon]).addTo(leafletMap)

  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize()
  }, 100)

}

/*
-------------------------------------
SEARCH CITY
-------------------------------------
*/

function getSuggestionLabel(result) {
  const a = result.address || {}
  const place = a.suburb || a.city_district || a.town || a.city || a.village || a.municipality || (result.display_name || "").split(",")[0]
  const state = a.state || ""
  return state ? `${place}, ${state}` : place
}

function chooseSuggestion(result) {
  const label = getSuggestionLabel(result)
  suppressSuggestions = true
  city.value = label
  locationName.value = label
  searchSuggestions.value = []
  geoMatches.value = []
  fetchUV(parseFloat(result.lat), parseFloat(result.lon))
}

watch(city, (newValue) => {
  const trimmed = (newValue || "").trim()

  if (suppressSuggestions) {
    suppressSuggestions = false
    return
  }

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }

  if (!trimmed || trimmed.length < 2) {
    searchSuggestions.value = []
    return
  }

  searchDebounceTimer = setTimeout(async () => {
    try {
      isSearchingCity.value = true
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&countrycodes=AU&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      if (Array.isArray(data)) {
        const seen = new Set()
        searchSuggestions.value = data.filter((r) => {
          const label = getSuggestionLabel(r)
          if (seen.has(label)) return false
          seen.add(label)
          return true
        })
      } else {
        searchSuggestions.value = []
      }
    } catch {
      searchSuggestions.value = []
    } finally {
      isSearchingCity.value = false
    }
  }, 150)
})

function pickLocation(match) {

  geoMatches.value = []
  locationName.value = match.state ? `${match.name}, ${match.state}` : match.name
  fetchUV(match.lat, match.lon)

}

async function searchCity() {
  const trimmed = (city.value || "").trim()
  if (!trimmed) {
    showEmptySearchPopup.value = true
    return
  }
  loading.value = true
  error.value = null
  uvData.value = null
  geoMatches.value = []

  const GEO_APPID = import.meta.env.VITE_GEO_APPID

  if (/^\d{4}$/.test(trimmed)) {

    try {

      const zipRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/zip?zip=${trimmed},AU&appid=${GEO_APPID}`
      )
      const zipData = await zipRes.json()

      if (!zipRes.ok || zipData.cod === "404" || zipData.lat == null || zipData.lon == null) {

        error.value = "Postcode not found in Australia"
        loading.value = false
        return

      }

      locationName.value = zipData.state ? `${zipData.name}, ${zipData.state}` : zipData.name
      fetchUV(zipData.lat, zipData.lon)

    } catch (err) {

      error.value = "Postcode not found in Australia"
      uvData.value = null
      loading.value = false

    }
    return

  }

  try {

    const q = `${trimmed},AU`
    const geo = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${GEO_APPID}`
    )

    const data = await geo.json()

    const auOnly = Array.isArray(data) ? data.filter((r) => r.country === "AU") : []

    if (auOnly.length === 0) {

      error.value = "City not found in Australia"
      loading.value = false
      return

    }

    const getLabel = (r) => (r.state ? `${r.name}, ${r.state}` : r.name)
    const coordKey = (r) => `${Math.round(Number(r.lat) * 10) / 10}_${Math.round(Number(r.lon) * 10) / 10}`
    const seenByCoord = new Map()
    for (const r of auOnly) {
      const key = coordKey(r)
      const label = getLabel(r)
      const existing = seenByCoord.get(key)
      if (!existing || label.length < getLabel(existing).length) {
        seenByCoord.set(key, r)
      }
    }
    let deduped = [...seenByCoord.values()]
    const seenByLabel = new Map()
    for (const r of deduped) {
      const label = getLabel(r)
      if (!seenByLabel.has(label)) {
        seenByLabel.set(label, r)
      }
    }
    deduped = [...seenByLabel.values()]

    if (deduped.length === 1) {

      locationName.value = deduped[0].state ? `${deduped[0].name}, ${deduped[0].state}` : deduped[0].name
      fetchUV(deduped[0].lat, deduped[0].lon)

    } else {

      geoMatches.value = deduped
      loading.value = false

    }

  } catch (err) {

    error.value = "City lookup failed"
    uvData.value = null

  }

  if (geoMatches.value.length <= 1) loading.value = false

}

/*
-------------------------------------
RUN WHEN DASHBOARD LOADS
-------------------------------------
*/

onMounted(async () => {

  const enabled = localStorage.getItem(reminderEnabledKey) === "true"
  const storedInterval = Number(localStorage.getItem(reminderIntervalMinutesKey) || "0")

  if (enabled && storedInterval > 0) {

    startReminder(storedInterval)

  }

})

onBeforeUnmount(() => {

  if (reminderTimer) clearTimeout(reminderTimer)

  if (countdownTimer) clearInterval(countdownTimer)

  if (successPopupTimer) {
    clearTimeout(successPopupTimer)
    successPopupTimer = null
  }

  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
    leafletMarker = null
  }

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }

})

</script>

<template>
  <div class="dashboard-root">
    <div class="bg-emojis" aria-hidden="true">
      <span class="bg-emoji bg-emoji-1">☀️</span>
      <span class="bg-emoji bg-emoji-2">🌊</span>
      <span class="bg-emoji bg-emoji-3">🏖️</span>
      <span class="bg-emoji bg-emoji-4">👒</span>
      <span class="bg-emoji bg-emoji-5">🕶️</span>
      <span class="bg-emoji bg-emoji-6">⛱️</span>
      <span class="bg-emoji bg-emoji-7">🌴</span>
      <span class="bg-emoji bg-emoji-8">🧴</span>
      <span class="bg-emoji bg-emoji-9">☀️</span>
      <span class="bg-emoji bg-emoji-10">🏝️</span>
      <span class="bg-emoji bg-emoji-11">👒</span>
      <span class="bg-emoji bg-emoji-12">🕶️</span>
      <span class="bg-emoji bg-emoji-12b">🏄</span>
      <span class="bg-emoji bg-emoji-13">🏃🏻</span>
      <span class="bg-emoji bg-emoji-14">🙋🏽</span>
      <span class="bg-emoji bg-emoji-15">👩🏿</span>
    </div>
    <header class="app-header">
      <div class="app-logo">
        <span class="app-logo-emoji">☀️</span>
        <span class="app-logo-text">SunShield</span>
      </div>
      <nav class="app-nav">
        <RouterLink
          to="/"
          class="app-nav-link app-nav-link--active"
          @click="resetDashboard"
        >
          Dashboard
        </RouterLink>
        <RouterLink to="/about" class="app-nav-link">
          About
        </RouterLink>
      </nav>
    </header>

    <main class="dashboard">
      <section class="hero">
        <div class="hero-left">
          <p class="hero-kicker">HELLO, WELCOME TO</p>
          <h1 class="hero-title">
            SunShield
            <br />
            <span class="hero-highlight">Your Sun Safety</span>
          </h1>
          <p class="hero-subtitle">
            Track today&apos;s UV index and get sunscreen and clothing advice,
            designed especially for your sun protection.
          </p>

          <div class="hero-meta">
            <span class="hero-dot"></span>
            Live UV guidance
            <span class="hero-separator">•</span>
            Sun‑friendly tips
          </div>
        </div>

        <div class="hero-right">
          <div class="hero-emoji-card">
            <span class="hero-emoji">☀️</span>
            <p class="hero-emoji-label">SunShield</p>
            <p class="hero-emoji-meta">Stay sun safe today</p>
            <p class="hero-reminder-question">Want to track your re‑application?</p>
            <div class="hero-reminder-control">
              <div class="hero-reminder-text">
                <span class="hero-reminder-status">
                  Sunscreen reminder
                  {{ reminderEnabled ? "On" : "Off" }}
                </span>
                <span
                  v-if="reminderEnabled && countdownDisplay"
                  class="hero-reminder-countdown"
                >
                  · next in {{ countdownDisplay }}
                </span>
              </div>
              <div class="hero-reminder-actions">
                <button
                  v-if="!reminderEnabled"
                  class="hero-reminder-button"
                  @click="enableReminder"
                >
                  🔔 Turn on
                </button>
                <button
                  v-else
                  class="hero-reminder-button hero-reminder-button-off"
                  @click="disableReminder"
                >
                  🔕 Turn off
                </button>
                <label class="hero-reminder-test-mode">
                  <input
                    v-model="testMode"
                    type="checkbox"
                    :disabled="reminderEnabled"
                  />
                  Test mode (1 min)
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="search-bar">
        <input
          v-model="city"
          class="search-input"
          placeholder="Suburb or postcode (Australia)"
          @keyup.enter="searchCity"
          autocomplete="off"
        />
        <button class="search-button" @click="searchCity">
          🔍 Search
        </button>
      </section>

      <div v-if="searchSuggestions.length || isSearchingCity" class="search-suggestions">
        <p v-if="isSearchingCity" class="search-suggestions-loading">Searching…</p>
        <button
          v-for="(result, i) in searchSuggestions"
          :key="i"
          class="search-suggestion-item"
          @click="chooseSuggestion(result)"
        >
          <span class="search-suggestion-primary">{{ getSuggestionLabel(result) }}</span>
          <span class="search-suggestion-secondary">{{ (result.display_name || '').split(',').slice(1, 3).join(',').trim() }}</span>
        </button>
      </div>

      <p v-if="error" class="search-error">{{ error }}</p>

      <div v-if="geoMatches.length > 1" class="geo-picker">
        <p class="geo-picker-label">Multiple matches – choose one:</p>
        <div class="geo-picker-buttons">
          <button
            v-for="(match, i) in geoMatches"
            :key="i"
            class="geo-picker-btn"
            @click="pickLocation(match)"
          >
            {{ match.state ? `${match.name}, ${match.state}` : match.name }}
          </button>
        </div>
      </div>

      <section v-if="uvData" class="uv-section">
        <div class="weather-map-card">
          <div class="weather-map-left">
            <div class="weather-meta-row">
              <span v-if="locationName" class="weather-strip-location">{{ locationName }}</span>
              <span v-if="uvData.timezone != null" class="weather-strip-date">{{ formatLocalDate(uvData.timezone) }}</span>
            </div>
            <div class="weather-meta-row">
              <span v-if="uvData.weather_id != null" class="weather-strip-emoji" aria-hidden="true">{{ getWeatherEmoji(uvData.weather_id) }}</span>
              <span v-if="uvData.max_temperature != null" class="weather-strip-temp">{{ Math.round(uvData.max_temperature) }} °C</span>
            </div>
            <div class="weather-meta-row">
              <span v-if="uvData.sunrise != null && uvData.timezone != null" class="weather-strip-time">🌅 Sunrise {{ formatLocalTime(uvData.sunrise, uvData.timezone) }}</span>
              <span v-if="uvData.sunset != null && uvData.timezone != null" class="weather-strip-time">🌇 Sunset {{ formatLocalTime(uvData.sunset, uvData.timezone) }}</span>
            </div>

            <div v-if="uvData.forecast && uvData.forecast.length" class="forecast-strip">
              <div
                v-for="(day, i) in uvData.forecast"
                :key="i"
                class="forecast-day"
              >
                <p class="forecast-day-label">{{ formatForecastDay(day.dt, uvData.timezone) }}</p>
                <p class="forecast-day-emoji" aria-hidden="true">{{ getWeatherEmoji(day.weather_id) }}</p>
                <p v-if="day.max_temp != null" class="forecast-day-temp">{{ Math.round(day.max_temp) }}°C</p>
                <p
                  v-if="day.uvi != null"
                  class="forecast-day-uv"
                  :style="{ color: getUVColor(day.uvi) }"
                >
                  UV {{ day.uvi.toFixed(0) }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="selectedLat != null && selectedLon != null" class="weather-map-right">
            <div id="location-map" class="map-container"></div>
          </div>
        </div>

        <div class="uv-circle-wrapper">
          <div class="uv-circle" :style="{ borderColor: getUVColor(uvData.uv_index) }">
            <div class="uv-index">
              {{ uvData.uv_index }}
            </div>
            <div class="uv-label">
              {{ uvData.risk_level }}
            </div>
          </div>
        </div>

        <div class="uv-risk-banner" :style="{ backgroundColor: getUVColor(uvData.uv_index) }">
          <span class="uv-risk-text">
            <span>Current UV index is:</span>
            <span class="uv-risk-level-text">{{ uvData.risk_level }} Risk</span>
          </span>
        </div>

        <div class="uv-message-box" :style="getUvMessageStyle(uvData.uv_index)">
          {{ getUvWarning(uvData.uv_index, uvData.reapply_minutes) }}
        </div>

        <section class="protection-card">
          <button
            class="protection-header"
            type="button"
            @click="showProtection = !showProtection"
            :aria-expanded="showProtection ? 'true' : 'false'"
          >
            <span>Sun Protection Recommendations</span>
            <span class="protection-header-indicator">
              {{ showProtection ? "−" : "+" }}
            </span>
          </button>

          <div v-if="showProtection" class="protection-body">
            <div class="protection-uv-stats">
              <div class="protection-uv-stat">
                <p class="protection-uv-stat-label">Current UV Index</p>
                <p class="protection-uv-stat-value" :style="{ color: getUVColor(uvData.uv_index) }">
                  {{ uvData.uv_index }}
                  <span class="protection-uv-stat-sub">({{ uvData.risk_level }})</span>
                </p>
              </div>
              <div
                v-if="uvData.peak_uv_index != null && uvData.peak_uv_index > 0"
                class="protection-uv-stat"
              >
                <p class="protection-uv-stat-label">Today&apos;s Peak UV</p>
                <p class="protection-uv-stat-value" :style="{ color: getUVColor(uvData.peak_uv_index) }">
                  {{ uvData.peak_uv_index.toFixed(1) }}
                  <span v-if="uvData.peak_uv_label" class="protection-uv-stat-sub">({{ uvData.peak_uv_label }})</span>
                </p>
                <p
                  v-if="uvData.peak_uv_time != null && uvData.timezone != null"
                  class="protection-uv-stat-time"
                >
                  around {{ formatLocalTime(uvData.peak_uv_time, uvData.timezone) }} local time
                  if you&apos;re heading out ☀️ make sure you slip, slap, slop
                </p>
              </div>
            </div>
            <div class="protection-columns">
              <div class="dosage-card">
                <h3 class="section-title">Sunscreen Dosage</h3>
                <p class="dosage-emojis" aria-hidden="true">{{ getSunscreenEmojis(uvData.uv_index) }}</p>
                <div class="dosage-box">
                  {{ uvData.sunscreen }}
                </div>
                <p class="dosage-caption">
                  Based on Cancer Council Australia teaspoon rule.
                </p>
                <p class="dosage-reapply">
                  Reapply every <strong>{{ uvData.reapply_minutes }} minutes</strong>.
                </p>
              </div>

              <div class="protection-divider" aria-hidden="true"></div>

              <div class="clothing-card">
                <h3 class="section-title">Clothing Recommendations</h3>
                <p class="clothing-emojis" aria-hidden="true">{{ getClothingEmojis(uvData.uv_index) }}</p>
                <p class="clothing-text">
                  {{ uvData.clothing }}
                </p>
              </div>
            </div>

            <div class="protection-reminder">
              <p class="reminder-label">Sunscreen Reminders</p>
              <div class="reminder-controls">
                <button
                  v-if="!reminderEnabled"
                  class="reminder-button"
                  @click="enableReminder"
                >
                  🔔 Turn on reminders
                </button>
                <button
                  v-if="reminderEnabled"
                  class="reminder-button reminder-button-off"
                  @click="disableReminder"
                >
                  🔕 Turn off reminders
                </button>
                <label
                  class="reminder-test-mode"
                >
                  <input
                    v-model="testMode"
                    type="checkbox"
                    :disabled="reminderEnabled"
                  />
                  Test mode (1 min)
                </label>
              </div>
              <p v-if="reminderEnabled && countdownDisplay" class="reminder-countdown">
                Next reminder in {{ countdownDisplay }}
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>

    <div
      v-if="showSuccessPopup"
      class="reminder-overlay loading-overlay"
    >
      <div class="reminder-popup loading-popup">
        <span class="reminder-popup-icon loading-spinner-icon">⏳</span>
        <h2 class="reminder-popup-title">Loading Info</h2>
        <p class="reminder-popup-text">
          Fetching UV data for {{ locationName || "your location" }}…
        </p>
        <div class="loading-bar-track">
          <div class="loading-bar-fill"></div>
        </div>
      </div>
    </div>

    <div v-if="showEmptySearchPopup" class="reminder-overlay" @click.self="showEmptySearchPopup = false">
      <div class="reminder-popup">
        <span class="reminder-popup-icon">📍</span>
        <h2 class="reminder-popup-title">Enter a location</h2>
        <p class="reminder-popup-text">Please enter a suburb or postcode, then click Search.</p>
        <button class="reminder-popup-btn" @click="showEmptySearchPopup = false">OK</button>
      </div>
    </div>

    <div v-if="reminderFired" class="reminder-overlay" @click.self="reminderFired = false">
      <div class="reminder-popup">
        <span class="reminder-popup-icon">☀️</span>
        <h2 class="reminder-popup-title">Sunscreen Reminder</h2>
        <p class="reminder-popup-text">Time to reapply your sunscreen!</p>
        <button class="reminder-popup-btn" @click="reminderFired = false">Got it</button>
      </div>
    </div>
  </div>
</template>

<style>
.dashboard-root {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #fff7c4, #ffe0c2);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #222;
}

.bg-emojis {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

@keyframes bgEmojiFloat {
  0%   { opacity: 0;    transform: translateY(0px) scale(0.9); }
  20%  { opacity: 0.16; transform: translateY(-6px) scale(1); }
  50%  { opacity: 0.13; transform: translateY(-12px) scale(1.05); }
  80%  { opacity: 0.16; transform: translateY(-6px) scale(1); }
  100% { opacity: 0;    transform: translateY(0px) scale(0.9); }
}

.bg-emoji {
  position: absolute;
  font-size: 2rem;
  opacity: 0;
  animation: bgEmojiFloat 8s ease-in-out infinite;
}

.bg-emoji-1  { top: 8%;    left: 5%;   font-size: 2.5rem; animation-duration: 9s;  animation-delay: 0s;    }
.bg-emoji-2  { top: 15%;   right: 8%;  font-size: 1.8rem; animation-duration: 11s; animation-delay: 1.5s;  }
.bg-emoji-3  { top: 25%;   left: 12%;  font-size: 2.2rem; animation-duration: 7s;  animation-delay: 3s;    }
.bg-emoji-4  { top: 40%;   right: 4%;  font-size: 1.6rem; animation-duration: 13s; animation-delay: 0.8s;  }
.bg-emoji-5  { top: 55%;   left: 3%;   font-size: 2rem;   animation-duration: 10s; animation-delay: 4.5s;  }
.bg-emoji-6  { top: 65%;   right: 15%; font-size: 2.4rem; animation-duration: 8s;  animation-delay: 2.2s;  }
.bg-emoji-7  { top: 75%;   left: 8%;   font-size: 2.8rem; animation-duration: 12s; animation-delay: 6s;    }
.bg-emoji-8  { bottom: 20%; right: 6%; font-size: 1.8rem; animation-duration: 9s;  animation-delay: 1s;    }
.bg-emoji-9  { bottom: 15%; left: 15%; font-size: 2.2rem; animation-duration: 14s; animation-delay: 3.5s;  }
.bg-emoji-10 { bottom: 35%; right: 25%; font-size: 1.5rem; animation-duration: 7s; animation-delay: 5s;    }
.bg-emoji-11 { top: 50%;   left: 2%;   font-size: 1.4rem; animation-duration: 11s; animation-delay: 7s;    }
.bg-emoji-12 { top: 85%;   right: 10%; font-size: 1.6rem; animation-duration: 10s; animation-delay: 2.8s;  }
.bg-emoji-12b{ top: 45%;   left: 6%;   font-size: 2rem;   animation-duration: 8s;  animation-delay: 0.4s;  }
.bg-emoji-13 { top: 20%;   right: 20%; font-size: 2rem;   animation-duration: 15s; animation-delay: 4s;    }
.bg-emoji-14 { top: 35%;   right: 30%; font-size: 2.2rem; animation-duration: 9s;  animation-delay: 6.5s;  }
.bg-emoji-15 { top: 60%;   right: 5%;  font-size: 1.9rem; animation-duration: 12s; animation-delay: 1.8s;  }

.app-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #ffffffcc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.app-logo {
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-logo-emoji {
  font-size: 1.5rem;
}

.app-logo-text {
  letter-spacing: 0.02em;
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-nav-link {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.app-nav-link:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #111827;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.app-nav-link--active {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
}

.dashboard {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 24px auto;
  padding: 0 16px 24px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.6fr);
  gap: 32px;
  align-items: center;
  padding: 32px 0 24px;
  min-height: 48vh;
  color: #111827;
}

.hero-left {
  max-width: 520px;
}

.hero-kicker {
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f97316;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 2.6rem;
  line-height: 1.1;
  margin: 0 0 8px;
}

.hero-highlight {
  color: #f97316;
  font-weight: 800;
}

.hero-subtitle {
  font-size: 0.98rem;
  color: #4b5563;
  margin-bottom: 16px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.hero-primary {
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.hero-secondary {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
  font-weight: 500;
  cursor: pointer;
}

.hero-meta {
  font-size: 0.85rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
}

.hero-separator {
  margin: 0 2px;
}

.hero-right {
  display: flex;
  justify-content: center;
}

.hero-emoji-card {
  width: 320px;
  border-radius: 24px;
  background: rgba(255, 249, 240, 0.95);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  padding: 28px 24px;
  text-align: center;
}

.hero-emoji {
  font-size: 3rem;
  display: block;
  margin-bottom: 8px;
}

.hero-emoji-label {
  font-weight: 700;
  margin-bottom: 4px;
}

.hero-emoji-meta {
  font-size: 0.85rem;
  color: #6b7280;
}

.hero-reminder-question {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #4b5563;
}

.hero-reminder-control {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 18px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.hero-reminder-status {
  font-size: 0.8rem;
  color: #4b5563;
}

.hero-reminder-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hero-reminder-countdown {
  font-size: 0.8rem;
  color: #6b7280;
}

.hero-reminder-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-reminder-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.hero-reminder-button-off {
  background: #9ca3af;
}

.hero-reminder-button:hover {
  opacity: 0.9;
}

.hero-reminder-test-mode {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #4b5563;
}

.search-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 12px auto 12px;
  max-width: 560px;
}

.summary-strip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  margin: 0 auto 16px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 249, 240, 0.9);
  font-size: 0.9rem;
}

.summary-location {
  font-weight: 600;
}

.summary-uv {
  font-weight: 700;
}

.search-input {
  flex: 1;
  max-width: 400px;
  padding: 14px 18px;
  border-radius: 999px;
  border: 1px solid #d4d4d4;
  font-size: 1.05rem;
}

.search-button {
  padding: 14px 24px;
  font-size: 1.05rem;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.search-button:hover {
  background: #ea580c;
}

.search-suggestions {
  max-width: 560px;
  margin: 0 auto 4px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.search-suggestions-loading {
  padding: 10px 16px;
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.search-suggestion-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.search-suggestion-item:last-child {
  border-bottom: none;
}

.search-suggestion-item:hover {
  background: #fff7ed;
}

.search-suggestion-primary {
  font-size: 0.93rem;
  font-weight: 600;
  color: #111827;
}

.search-suggestion-secondary {
  font-size: 0.78rem;
  color: #6b7280;
}

.search-error {
  text-align: center;
  margin: 8px auto 0;
  max-width: 560px;
  font-size: 0.95rem;
  color: #b91c1c;
}

.geo-picker {
  max-width: 560px;
  margin: 12px auto 0;
  padding: 12px 16px;
  background: rgba(255, 249, 240, 0.95);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.geo-picker-label {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 8px;
  color: #374151;
}

.geo-picker-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.geo-picker-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #f97316;
  background: #fff;
  color: #f97316;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.geo-picker-btn:hover {
  background: #fff7ed;
}

.status-messages {
  text-align: center;
  margin-bottom: 16px;
}

.status {
  margin: 4px 0;
  font-size: 0.95rem;
}

.status-loading {
  color: #4b5563;
}

.status-error {
  color: #b91c1c;
}

.status-location {
  color: #374151;
}

.uv-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.weather-map-card {
  display: flex;
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: rgba(255, 249, 240, 0.98);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.weather-map-left {
  flex: 1 1 0;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.weather-map-right {
  flex: 0 0 220px;
  border-left: 1px solid #e5e7eb;
}

.weather-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
}

.weather-strip-location {
  font-weight: 700;
  font-size: 0.95rem;
  color: #111827;
}

.weather-strip-date {
  font-size: 0.82rem;
  color: #6b7280;
}

.weather-strip-emoji {
  font-size: 1.5rem;
}

.weather-strip-temp {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
}

.weather-strip-time {
  font-size: 0.82rem;
  color: #4b5563;
}

.forecast-strip {
  display: flex;
  gap: 6px;
  width: 100%;
  overflow-x: auto;
  padding: 2px 0 4px;
}

.forecast-day {
  flex: 1 0 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(255, 249, 240, 0.95);
  border: 1px solid #e5e7eb;
  text-align: center;
}

.forecast-day-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  white-space: nowrap;
}

.forecast-day-emoji {
  font-size: 1.6rem;
  margin: 2px 0;
}

.forecast-day-temp {
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.forecast-day-uv {
  font-size: 0.78rem;
  font-weight: 700;
  margin: 0;
}

.map-container {
  height: 240px;
  width: 100%;
}

.uv-circle-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.uv-circle {
  width: 120px;
  height: 120px;
  border-radius: 999px;
  border: 6px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.uv-index {
  font-size: 2.75rem;
  font-weight: 700;
}

.uv-label {
  margin-top: 4px;
  font-size: 0.95rem;
  color: #4b5563;
}

.uv-risk-banner {
  width: 100%;
  max-width: 360px;
  padding: 10px 16px;
  border-radius: 999px;
  margin-top: 10px;
  text-align: center;
  color: #fff;
  font-weight: 700;
  background: #f97316;
}

.uv-risk-text {
  font-size: 0.98rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.uv-risk-level-text {
  font-weight: 700;
}

.uv-message-box {
  max-width: 440px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px dashed transparent;
  background: transparent;
  font-size: 0.95rem;
  text-align: center;
}

.guidance-card {
  width: 100%;
  max-width: 460px;
  margin-top: 8px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #ffffffcc;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  font-size: 0.95rem;
}

.guidance-card p {
  margin: 6px 0;
}

.protection-card {
  width: 100%;
  max-width: 520px;
  margin-top: 12px;
  border-radius: 16px;
  background: #ffffffcc;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.protection-header {
  width: 100%;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: 0.98rem;
  cursor: pointer;
}

.protection-header-indicator {
  font-size: 1.1rem;
}

.protection-body {
  padding: 0 18px 16px;
  border-top: 1px solid #e5e7eb;
}

.protection-uv-context {
  font-size: 0.9rem;
  color: #4b5563;
  margin: 0 0 12px;
}

.protection-uv-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0 16px;
}

.protection-uv-stat {
  flex: 1 1 140px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.protection-uv-stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin: 0 0 4px;
}

.protection-uv-stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.1;
}

.protection-uv-stat-sub {
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
  margin-left: 4px;
}

.protection-uv-stat-time {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 4px 0 0;
}

.protection-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.protection-divider {
  width: 1px;
  background: #e5e7eb;
  align-self: stretch;
  flex-shrink: 0;
}

.dosage-card,
.clothing-card {
  flex: 1 1 220px;
}

.section-title {
  margin-bottom: 6px;
  font-size: 0.98rem;
  font-weight: 600;
}

.dosage-emojis {
  font-size: 1.5rem;
  margin: 0 0 8px;
  letter-spacing: 0.2em;
}

.dosage-box {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f3f4f680;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.dosage-caption {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.dosage-reapply {
  font-size: 0.9rem;
  color: #111827;
}

.clothing-emojis {
  font-size: 1.5rem;
  margin: 0 0 8px;
  letter-spacing: 0.2em;
}

.clothing-text {
  font-size: 0.95rem;
}

.protection-reminder {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.reminder-label {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.reminder-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
}

.reminder-button {
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
}

.reminder-button-off {
  background: #9ca3af;
}

.reminder-button:hover {
  opacity: 0.9;
}

.reminder-note {
  font-size: 0.95rem;
  color: #6b7280;
}

.reminder-test-mode {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #4b5563;
  cursor: pointer;
}

.reminder-test-mode input {
  cursor: pointer;
}

.reminder-test-mode input:disabled {
  cursor: not-allowed;
}

.reminder-countdown {
  margin-top: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #f97316;
}

.reminder-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  animation: fadeIn 0.2s ease;
}

.loading-overlay {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(3px);
}

.loading-popup {
  padding: 32px 36px 28px;
}

@keyframes spinHourglass {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(180deg); }
  100% { transform: rotate(180deg); }
}

.loading-spinner-icon {
  animation: spinHourglass 1.4s ease-in-out infinite;
  display: inline-block;
}

.loading-bar-track {
  margin-top: 16px;
  height: 6px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

@keyframes loadingBar {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.loading-bar-fill {
  height: 100%;
  width: 50%;
  background: linear-gradient(90deg, #f97316, #fbbf24);
  border-radius: 999px;
  animation: loadingBar 1.2s ease-in-out infinite;
}

.reminder-popup {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  padding: 36px 40px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  animation: popIn 0.25s ease;
}

.reminder-popup-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 8px;
}

.reminder-popup-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
}

.reminder-popup-text {
  font-size: 0.98rem;
  color: #4b5563;
  margin: 0 0 20px;
}

.reminder-popup-btn {
  padding: 10px 28px;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.reminder-popup-btn:hover {
  background: #ea580c;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 600px) {
  .dashboard {
    margin: 24px auto;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-right {
    justify-content: flex-start;
  }

  .uv-circle {
    width: 120px;
    height: 120px;
  }

  .protection-body {
    padding-inline: 14px;
  }

  .protection-divider {
    display: none;
  }

  .weather-map-card {
    flex-direction: column;
  }

  .weather-map-right {
    flex: 0 0 auto;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }

  .map-container {
    height: 180px;
  }
}
</style>