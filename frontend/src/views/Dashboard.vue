<script setup>

import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue"
import { RouterLink, useRouter } from "vue-router"
import api from "../services/api"
import { useReminder } from "../composables/useReminder"

const router = useRouter()
const { enableReminder } = useReminder()

const uvData = ref(null)
const error = ref(null)
const loading = ref(false)
const isLocating = ref(false)

const city = ref("")
const locationName = ref("")
const geoMatches = ref([])
const searchSuggestions = ref([])
const isSearchingCity = ref(false)

const showEmptySearchPopup = ref(false)
const showSuccessPopup = ref(false)
const activeModal = ref(null) // 'sunscreen' | 'clothing' | null

const resultsSection = ref(null)
const chartCard = ref(null)

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
  if (value <= 2)  return "#22c55e"
  if (value <= 5)  return "#eab308"
  if (value <= 7)  return "#f97316"
  if (value <= 10) return "#ef4444"
  return "#a855f7"
}

function getUvWarning(uvIndex) {
  const value = Number(uvIndex ?? 0)
  if (value <= 2)  return "Minimal risk. No protection required unless outside for extended periods or near reflective surfaces (snow/water)."
  if (value <= 5)  return "Moderate risk. Seek shade, wear clothing, hat, and sunglasses, and apply SPF 50+ sunscreen."
  if (value <= 7)  return "High risk. Same as moderate, but take extra care, especially between 10 am and 4 pm."
  if (value <= 10) return "Very high risk. Avoid sun between 10 am and 4 pm, use all protection measures."
  return "Extreme risk. Take all precautions. Unprotected skin burns in minutes."
}

function hexToRgba(hex, alpha) {
  const n = String(hex).replace("#", "")
  if (n.length !== 6) return `rgba(0,0,0,${alpha})`
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getUvMessageStyle(uvIndex) {
  const base = getUVColor(uvIndex)
  return { borderColor: base, backgroundColor: hexToRgba(base, 0.1), color: "#111827" }
}

function getClothingEmojis(uvIndex) {
  const v = Number(uvIndex ?? 0)
  if (v <= 2)  return "👒"
  if (v <= 5)  return "👒 🕶️ 👕"
  if (v <= 7)  return "👒 🕶️ 👕 🧥"
  if (v <= 10) return "👒 🕶️ 👕 🧥 ⛱️"
  return "👒 🕶️ 👕 🧥 ⛱️ 🏠"
}

function getSunscreenEmojis(uvIndex) {
  const v = Number(uvIndex ?? 0)
  if (v <= 2)  return "🧴"
  if (v <= 5)  return "🧴 ✅"
  if (v <= 7)  return "🧴 ✅ 🔁"
  if (v <= 10) return "🧴 ✅ 🔁 ⚠️"
  return "🧴 ✅ 🔁 ⚠️ 🚨"
}

function formatLocalTime(unixSeconds, timezoneSeconds) {
  if (unixSeconds == null || timezoneSeconds == null) return ""
  const localTotalSeconds = unixSeconds + timezoneSeconds
  const secondsInDay = ((localTotalSeconds % 86400) + 86400) % 86400
  const hours = Math.floor(secondsInDay / 3600)
  const minutes = Math.floor((secondsInDay % 3600) / 60)
  const ampm = hours >= 12 ? "pm" : "am"
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`
}

function uvScalePosition(uvIndex) {
  const pct = Math.min(Math.max(Number(uvIndex ?? 0) / 13, 0), 1) * 100
  return `calc(${pct}% - 16px)`
}

/* max UV on chart scale */
const CHART_MAX_UV = 12

const hoveredBar = ref(null)

function uvBarHeightPct(uvi) {
  return Math.min(Math.max(Number(uvi ?? 0) / CHART_MAX_UV, 0), 1) * 100
}

function isCurrentHour(dt, tzOffset) {
  if (dt == null || tzOffset == null) return false
  const nowUtc  = Math.floor(Date.now() / 1000)
  const localNow = nowUtc + tzOffset
  const localDt  = dt + tzOffset
  const nowHour  = Math.floor(localNow / 3600) * 3600
  const dtHour   = Math.floor(localDt  / 3600) * 3600
  return nowHour === dtHour
}

function hourLabel(dt, tzOffset, index) {
  if (dt == null || tzOffset == null) return ""
  if (index !== 0 && index % 3 !== 0) return ""
  const localSecs = dt + tzOffset
  const hours = Math.floor(((localSecs % 86400) + 86400) % 86400 / 3600)
  const ampm  = hours >= 12 ? "pm" : "am"
  const h12   = hours % 12 || 12
  return `${h12}${ampm}`
}

function getRiskLabel(uvi) {
  const v = Number(uvi ?? 0)
  if (v <= 2)  return "Low"
  if (v <= 5)  return "Moderate"
  if (v <= 7)  return "High"
  if (v <= 10) return "Very High"
  return "Extreme"
}

function hourFull(dt, tzOffset) {
  if (dt == null || tzOffset == null) return ""
  const localSecs = dt + tzOffset
  const hours   = Math.floor(((localSecs % 86400) + 86400) % 86400 / 3600)
  const minutes = Math.floor((localSecs % 3600 + 3600) % 3600 / 60)
  const ampm = hours >= 12 ? "pm" : "am"
  const h12  = hours % 12 || 12
  return `${h12}:${String(minutes).padStart(2, "0")} ${ampm}`
}

/*
-------------------------------------
RESET
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
  showSuccessPopup.value = false
  if (successPopupTimer) { clearTimeout(successPopupTimer); successPopupTimer = null }
  if (searchDebounceTimer) { clearTimeout(searchDebounceTimer); searchDebounceTimer = null }
}

/*
-------------------------------------
FETCH UV DATA
-------------------------------------
*/

async function fetchUV(lat, lon) {
  loading.value = true
  error.value = null
  if (successPopupTimer) { clearTimeout(successPopupTimer); successPopupTimer = null }
  showSuccessPopup.value = true

  try {
    const res = await api.get(`/api/uv?lat=${lat}&lon=${lon}`)
    uvData.value = res.data
    nextTick(() => {
      resultsSection.value?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    successPopupTimer = setTimeout(() => {
      showSuccessPopup.value = false
      successPopupTimer = null
    }, 2000)
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

/*
-------------------------------------
USE MY LOCATION
-------------------------------------
*/

function useMyLocation() {
  if (!navigator.geolocation) {
    error.value = "Geolocation is not supported by your browser"
    return
  }
  isLocating.value = true
  error.value = null
  uvData.value = null
  searchSuggestions.value = []
  geoMatches.value = []

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      // Reverse geocode with Nominatim to get a friendly location name
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "Accept-Language": "en" } }
        )
        const data = await res.json()
        const a = data.address || {}
        const place = a.suburb || a.town || a.city || a.village || a.county || "Your location"
        const state = a.state || ""
        locationName.value = state ? `${place}, ${state}` : place
        suppressSuggestions = true
        city.value = locationName.value
      } catch {
        locationName.value = "Your location"
      }
      isLocating.value = false
      fetchUV(latitude, longitude)
    },
    (err) => {
      isLocating.value = false
      if (err.code === 1) error.value = "Location access denied. Please allow location access and try again."
      else error.value = "Unable to determine your location. Try searching manually."
    },
    { timeout: 10000 }
  )
}

/*
-------------------------------------
SEARCH
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
  if (suppressSuggestions) { suppressSuggestions = false; return }
  if (searchDebounceTimer) { clearTimeout(searchDebounceTimer); searchDebounceTimer = null }
  if (!trimmed || trimmed.length < 2) { searchSuggestions.value = []; return }

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
  if (!trimmed) { showEmptySearchPopup.value = true; return }

  loading.value = true
  error.value = null
  uvData.value = null
  geoMatches.value = []

  const GEO_APPID = import.meta.env.VITE_GEO_APPID

  if (/^\d{4}$/.test(trimmed)) {
    try {
      const zipRes = await fetch(`https://api.openweathermap.org/geo/1.0/zip?zip=${trimmed},AU&appid=${GEO_APPID}`)
      const zipData = await zipRes.json()
      if (!zipRes.ok || zipData.cod === "404" || zipData.lat == null) {
        error.value = "Postcode not found in Australia"
        loading.value = false
        return
      }
      locationName.value = zipData.state ? `${zipData.name}, ${zipData.state}` : zipData.name
      fetchUV(zipData.lat, zipData.lon)
    } catch {
      error.value = "Postcode not found in Australia"
      loading.value = false
    }
    return
  }

  try {
    const geo = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(trimmed + ",AU")}&limit=5&appid=${GEO_APPID}`
    )
    const data = await geo.json()
    const auOnly = Array.isArray(data) ? data.filter((r) => r.country === "AU") : []

    if (auOnly.length === 0) { error.value = "City not found in Australia"; loading.value = false; return }

    const getLabel = (r) => (r.state ? `${r.name}, ${r.state}` : r.name)
    const coordKey = (r) => `${Math.round(Number(r.lat) * 10) / 10}_${Math.round(Number(r.lon) * 10) / 10}`
    const seenByCoord = new Map()
    for (const r of auOnly) {
      const key = coordKey(r)
      const existing = seenByCoord.get(key)
      if (!existing || getLabel(r).length < getLabel(existing).length) seenByCoord.set(key, r)
    }
    let deduped = [...seenByCoord.values()]
    const seenByLabel = new Map()
    for (const r of deduped) { if (!seenByLabel.has(getLabel(r))) seenByLabel.set(getLabel(r), r) }
    deduped = [...seenByLabel.values()]

    if (deduped.length === 1) {
      locationName.value = getLabel(deduped[0])
      fetchUV(deduped[0].lat, deduped[0].lon)
    } else {
      geoMatches.value = deduped
      loading.value = false
    }
  } catch {
    error.value = "City lookup failed"
    uvData.value = null
  }

  if (geoMatches.value.length <= 1) loading.value = false
}

onMounted(() => {})

onBeforeUnmount(() => {
  if (successPopupTimer) { clearTimeout(successPopupTimer); successPopupTimer = null }
  if (searchDebounceTimer) { clearTimeout(searchDebounceTimer); searchDebounceTimer = null }
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
        <RouterLink to="/" class="app-nav-link">Home</RouterLink>
        <RouterLink to="/dashboard" class="app-nav-link app-nav-link--active">Dashboard</RouterLink>
        <RouterLink to="/reminder" class="app-nav-link">Reminder</RouterLink>
        <RouterLink to="/about" class="app-nav-link">About</RouterLink>
      </nav>
    </header>

    <main class="dashboard">
      <div class="page-header animate-up" style="--delay: 0.05s">
        <h1 class="page-title">☀️ Check UV Levels</h1>
        <p class="page-subtitle">Get real-time UV conditions and personalised protection advice for any Australian location</p>
      </div>

      <!-- Search row -->
      <div class="search-group animate-up" style="--delay: 0.22s">
        <section class="search-bar">
          <input
            v-model="city"
            class="search-input"
            placeholder="Suburb or postcode (Australia)"
            @keyup.enter="searchCity"
            autocomplete="off"
          />
          <button
            class="location-button"
            @click="useMyLocation"
            :disabled="isLocating || loading"
          >
            <span v-if="isLocating" class="locating-spinner">⏳</span>
            <span v-else>📍</span>
            {{ isLocating ? "Locating…" : "Use My Location" }}
          </button>
        </section>
      </div>

      <!-- Typeahead suggestions -->
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

      <!-- Empty state -->
      <Transition name="results">
        <div v-if="!uvData && !loading" class="empty-state">
          <div class="empty-state-icon">🌤️</div>
          <p class="empty-state-heading">Where are you today?</p>
          <p class="empty-state-body">Type a suburb or postcode above, or tap <strong>Use My Location</strong> to instantly check your UV exposure right now.</p>
          <div class="empty-state-steps">
            <div class="empty-step">
              <span class="empty-step-num">1</span>
              <span>Enter your location</span>
            </div>
            <div class="empty-step-arrow">→</div>
            <div class="empty-step">
              <span class="empty-step-num">2</span>
              <span>See your UV index</span>
            </div>
            <div class="empty-step-arrow">→</div>
            <div class="empty-step">
              <span class="empty-step-num">3</span>
              <span>Get protection advice</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Results -->
      <Transition name="results">
        <section v-if="uvData" ref="resultsSection" class="uv-section">

          <!-- Location label -->
          <p v-if="locationName" class="result-location">📍 {{ locationName }}</p>

          <!-- Big UV circle -->
          <div class="uv-circle-wrapper">
            <div
              class="uv-circle"
              :style="{
                borderColor: getUVColor(uvData.uv_index),
                boxShadow: `0 0 0 8px ${hexToRgba(getUVColor(uvData.uv_index), 0.15)}`
              }"
            >
              <div class="uv-circle-eyebrow">Current UV Index</div>
              <div class="uv-index-num" :style="{ color: getUVColor(uvData.uv_index) }">
                {{ uvData.uv_index }}
              </div>
              <div class="uv-risk-label">{{ uvData.risk_level }}</div>
            </div>
          </div>

          <!-- UV scale with live indicator -->
          <div class="uv-scale-widget">
            <div class="uv-scale-bar">
              <span class="uv-scale-seg seg-low">Low</span>
              <span class="uv-scale-seg seg-mod">Mod</span>
              <span class="uv-scale-seg seg-high">High</span>
              <span class="uv-scale-seg seg-very">V.High</span>
              <span class="uv-scale-seg seg-ext">Extreme</span>
            </div>
            <div class="uv-scale-track">
              <div
                class="uv-scale-indicator"
                :style="{ left: uvScalePosition(uvData.uv_index) }"
              >
                <span class="uv-scale-indicator-label">{{ uvData.uv_index }}</span>
              </div>
            </div>
            <div class="uv-scale-numbers">
              <span>0</span><span>3</span><span>6</span><span>8</span><span>11+</span>
            </div>
          </div>

          <!-- Warning message -->
          <div class="uv-message-box" :style="getUvMessageStyle(uvData.uv_index)">
            {{ getUvWarning(uvData.uv_index) }}
          </div>

          <!-- 24-hour UV chart -->
          <div v-if="uvData.hourly_uv && uvData.hourly_uv.length" ref="chartCard" class="uv-chart-card">

            <!-- Header row -->
            <div class="uv-chart-top">
              <div class="uv-chart-title-row">
                <span class="uv-chart-title">UV Index — Next 24 Hours</span>
                <p v-if="uvData.peak_uv_time != null && uvData.timezone != null" class="uv-chart-peak-time">
                  ⏰ Peak around {{ formatLocalTime(uvData.peak_uv_time, uvData.timezone) }}
                </p>
              </div>
              <span
                v-if="uvData.peak_uv_index != null"
                class="uv-chart-peak-badge"
                :style="{ background: hexToRgba(getUVColor(uvData.peak_uv_index), 0.15), color: getUVColor(uvData.peak_uv_index) }"
              >
                Peak {{ uvData.peak_uv_index.toFixed(1) }} · {{ uvData.peak_uv_label }}
              </span>
            </div>

            <!-- Tooltip -->
            <div class="uv-chart-tooltip" :class="{ visible: hoveredBar !== null }">
              <template v-if="hoveredBar !== null">
                <span class="uv-tooltip-time">{{ hourFull(uvData.hourly_uv[hoveredBar].dt, uvData.timezone) }}</span>
                <span
                  class="uv-tooltip-value"
                  :style="{ color: getUVColor(uvData.hourly_uv[hoveredBar].uvi) }"
                >UV {{ uvData.hourly_uv[hoveredBar].uvi.toFixed(1) }}</span>
                <span class="uv-tooltip-risk">{{ hoveredBar !== null ? getRiskLabel(uvData.hourly_uv[hoveredBar].uvi) : '' }}</span>
              </template>
              <template v-else>
                <span class="uv-tooltip-hint">Hover a bar to inspect</span>
              </template>
            </div>

            <!-- Chart body: y-axis + bars -->
            <div class="uv-chart-body">
              <!-- Y-axis -->
              <div class="uv-y-axis">
                <span>12</span>
                <span>9</span>
                <span>6</span>
                <span>3</span>
                <span>0</span>
              </div>

              <!-- Bars area -->
              <div class="uv-bars-wrap">
                <!-- Horizontal grid lines -->
                <div class="uv-grid">
                  <div class="uv-grid-line" style="bottom: 100%"></div>
                  <div class="uv-grid-line" style="bottom: 75%"></div>
                  <div class="uv-grid-line" style="bottom: 50%"></div>
                  <div class="uv-grid-line" style="bottom: 25%"></div>
                  <div class="uv-grid-line" style="bottom: 0%"></div>
                </div>

                <!-- One column per hour -->
                <div
                  v-for="(h, i) in uvData.hourly_uv"
                  :key="i"
                  class="uv-bar-col"
                  :class="{ 'uv-bar-col--now': isCurrentHour(h.dt, uvData.timezone), 'uv-bar-col--hovered': hoveredBar === i }"
                  @mouseenter="hoveredBar = i"
                  @mouseleave="hoveredBar = null"
                >
                  <div
                    class="uv-bar-fill"
                    :style="{
                      height: uvBarHeightPct(h.uvi) + '%',
                      background: getUVColor(h.uvi),
                      opacity: hoveredBar !== null && hoveredBar !== i ? 0.45 : 0.9
                    }"
                  ></div>
                  <span
                    class="uv-bar-x-label"
                    :class="{ 'uv-bar-x-label--now': isCurrentHour(h.dt, uvData.timezone) }"
                  >{{ hourLabel(h.dt, uvData.timezone, i) }}</span>
                </div>
              </div>
            </div>

            <!-- Legend -->
            <div class="uv-chart-legend">
              <span class="uv-legend-item"><span class="uv-legend-dot" style="background:#22c55e"></span>Low</span>
              <span class="uv-legend-item"><span class="uv-legend-dot" style="background:#eab308"></span>Moderate</span>
              <span class="uv-legend-item"><span class="uv-legend-dot" style="background:#f97316"></span>High</span>
              <span class="uv-legend-item"><span class="uv-legend-dot" style="background:#ef4444"></span>Very High</span>
              <span class="uv-legend-item"><span class="uv-legend-dot" style="background:#a855f7"></span>Extreme</span>
            </div>
          </div>

          <!-- User journey nudge -->
          <div class="nudge-prompt">
            <span class="nudge-icon">👇</span>
            <p class="nudge-text">Tap a tile to see your personalised recommendations</p>
          </div>

          <!-- Protection tiles -->
          <div class="protection-tiles">
            <button class="tile tile-sunscreen" @click="activeModal = 'sunscreen'">
              <div class="tile-header">
                <span class="tile-icon">🧴</span>
                <div class="tile-info">
                  <h3 class="tile-title">Sunscreen</h3>
                  <p class="tile-hint">How much do I need to apply?</p>
                </div>
                <span class="tile-arrow">→</span>
              </div>
            </button>

            <button class="tile tile-clothing" @click="activeModal = 'clothing'">
              <div class="tile-header">
                <span class="tile-icon">👒</span>
                <div class="tile-info">
                  <h3 class="tile-title">Clothing</h3>
                  <p class="tile-hint">What should I wear today?</p>
                </div>
                <span class="tile-arrow">→</span>
              </div>
            </button>
          </div>

        </section>
      </Transition>
    </main>

    <!-- Loading overlay -->
    <div v-if="showSuccessPopup" class="overlay loading-overlay">
      <div class="popup loading-popup">
        <span class="popup-icon loading-spinner-icon">⏳</span>
        <h2 class="popup-title">Loading Info</h2>
        <p class="popup-text">Fetching UV data for {{ locationName || "your location" }}…</p>
        <div class="loading-bar-track">
          <div class="loading-bar-fill"></div>
        </div>
      </div>
    </div>

    <!-- Sunscreen modal -->
    <Transition name="sheet">
      <div v-if="activeModal === 'sunscreen'" class="sheet-overlay" @click.self="activeModal = null">
        <div class="sheet" role="dialog" aria-modal="true" aria-label="Sunscreen Recommendation">
          <button class="sheet-close" @click="activeModal = null" aria-label="Close">✕</button>
          <div class="sheet-icon">🧴</div>
          <h2 class="sheet-title">Sunscreen Dosage</h2>
          <p class="sheet-subtitle">For UV index <strong :style="{ color: getUVColor(uvData?.uv_index) }">{{ uvData?.uv_index }} — {{ uvData?.risk_level }}</strong></p>

          <div class="sheet-emojis">{{ getSunscreenEmojis(uvData?.uv_index) }}</div>

          <div class="sheet-advice">{{ uvData?.sunscreen }}</div>

          <div class="sheet-reapply">
            <p class="sheet-reapply-label">Reapply every</p>
            <p class="sheet-reapply-value">{{ uvData?.reapply_minutes }} minutes</p>
          </div>

          <div class="sheet-tips">
            <p class="sheet-tips-title">Quick tips</p>
            <ul class="sheet-tips-list">
              <li>Apply SPF 50+ broad-spectrum sunscreen</li>
              <li>Apply 20 minutes before going outside</li>
              <li>Don't forget ears, neck, and back of hands</li>
              <li>Reapply after swimming or sweating</li>
            </ul>
          </div>

          <button
            class="sheet-reminder-btn"
            @click="() => { enableReminder(uvData?.reapply_minutes); activeModal = null; router.push('/reminder') }"
          >
            🔔 Set a reapply reminder
          </button>

          <p class="sheet-source">Based on Cancer Council Australia SunSmart guidelines</p>
        </div>
      </div>
    </Transition>

    <!-- Clothing modal -->
    <Transition name="sheet">
      <div v-if="activeModal === 'clothing'" class="sheet-overlay" @click.self="activeModal = null">
        <div class="sheet" role="dialog" aria-modal="true" aria-label="Clothing Recommendation">
          <button class="sheet-close" @click="activeModal = null" aria-label="Close">✕</button>
          <div class="sheet-icon">👒</div>
          <h2 class="sheet-title">Clothing Recommendations</h2>
          <p class="sheet-subtitle">For UV index <strong :style="{ color: getUVColor(uvData?.uv_index) }">{{ uvData?.uv_index }} — {{ uvData?.risk_level }}</strong></p>

          <div class="sheet-emojis">{{ getClothingEmojis(uvData?.uv_index) }}</div>

          <div class="sheet-advice">{{ uvData?.clothing }}</div>

          <div class="sheet-tips">
            <p class="sheet-tips-title">Quick tips</p>
            <ul class="sheet-tips-list">
              <li>Look for UPF-rated clothing for best protection</li>
              <li>Darker and tighter-woven fabrics block more UV</li>
              <li>A broad-brimmed hat protects face, neck and ears</li>
              <li>Wrap-around sunglasses block UV from all angles</li>
            </ul>
          </div>

          <p class="sheet-source">Based on Cancer Council Australia SunSmart guidelines</p>
        </div>
      </div>
    </Transition>

    <!-- Empty search popup -->
    <div v-if="showEmptySearchPopup" class="overlay" @click.self="showEmptySearchPopup = false">
      <div class="popup">
        <span class="popup-icon">📍</span>
        <h2 class="popup-title">Enter a location</h2>
        <p class="popup-text">Please enter a suburb or postcode, then click Search.</p>
        <button class="popup-btn" @click="showEmptySearchPopup = false">OK</button>
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

/* ── Background emojis ── */
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

.bg-emoji { position: absolute; font-size: 2rem; opacity: 0; animation: bgEmojiFloat 8s ease-in-out infinite; }
.bg-emoji-1  { top: 8%;    left: 5%;   font-size: 2.5rem; animation-duration: 9s;  animation-delay: 0s;   }
.bg-emoji-2  { top: 15%;   right: 8%;  font-size: 1.8rem; animation-duration: 11s; animation-delay: 1.5s; }
.bg-emoji-3  { top: 25%;   left: 12%;  font-size: 2.2rem; animation-duration: 7s;  animation-delay: 3s;   }
.bg-emoji-4  { top: 40%;   right: 4%;  font-size: 1.6rem; animation-duration: 13s; animation-delay: 0.8s; }
.bg-emoji-5  { top: 55%;   left: 3%;   font-size: 2rem;   animation-duration: 10s; animation-delay: 4.5s; }
.bg-emoji-6  { top: 65%;   right: 15%; font-size: 2.4rem; animation-duration: 8s;  animation-delay: 2.2s; }
.bg-emoji-7  { top: 75%;   left: 8%;   font-size: 2.8rem; animation-duration: 12s; animation-delay: 6s;   }
.bg-emoji-8  { bottom: 20%; right: 6%; font-size: 1.8rem; animation-duration: 9s;  animation-delay: 1s;   }
.bg-emoji-9  { bottom: 15%; left: 15%; font-size: 2.2rem; animation-duration: 14s; animation-delay: 3.5s; }
.bg-emoji-10 { bottom: 35%; right: 25%; font-size: 1.5rem; animation-duration: 7s; animation-delay: 5s;   }
.bg-emoji-11 { top: 50%;   left: 2%;   font-size: 1.4rem; animation-duration: 11s; animation-delay: 7s;   }
.bg-emoji-12 { top: 85%;   right: 10%; font-size: 1.6rem; animation-duration: 10s; animation-delay: 2.8s; }
.bg-emoji-12b{ top: 45%;   left: 6%;   font-size: 2rem;   animation-duration: 8s;  animation-delay: 0.4s; }
.bg-emoji-13 { top: 20%;   right: 20%; font-size: 2rem;   animation-duration: 15s; animation-delay: 4s;   }
.bg-emoji-14 { top: 35%;   right: 30%; font-size: 2.2rem; animation-duration: 9s;  animation-delay: 6.5s; }
.bg-emoji-15 { top: 60%;   right: 5%;  font-size: 1.9rem; animation-duration: 12s; animation-delay: 1.8s; }

/* ── Header ── */
.app-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #ffffffcc;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.app-logo {
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-logo-emoji { font-size: 1.5rem; }
.app-logo-text  { letter-spacing: 0.02em; }

.app-nav { display: flex; align-items: center; gap: 16px; }

.app-nav-link {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.app-nav-link:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #111827;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.app-nav-link--active {
  background: #f97316;
  color: #fff;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
}

/* ── Main layout ── */
.dashboard {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px 48px;
}

.page-header {
  padding: 28px 0 16px;
  text-align: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
}

.page-subtitle {
  font-size: 0.92rem;
  color: #6b7280;
  margin: 0;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 480px;
  margin: 12px auto 0;
  padding: 28px 24px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  border: 1.5px dashed rgba(249, 115, 22, 0.3);
  text-align: center;
}

.empty-state-icon {
  font-size: 2.8rem;
  line-height: 1;
}

.empty-state-heading {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.empty-state-body {
  font-size: 0.88rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
  max-width: 340px;
}

.empty-state-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.empty-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f97316;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.empty-step-arrow {
  font-size: 0.85rem;
  color: #d1d5db;
}

/* ── Search group ── */
.search-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 8px;
}

.search-bar {
  display: flex;
  gap: 10px;
}

.search-input {
  flex: 1;
  padding: 14px 18px;
  border-radius: 999px;
  border: 1px solid #d4d4d4;
  font-size: 1rem;
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}

.location-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 22px;
  border-radius: 999px;
  border: 2px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
}

.location-button:hover:not(:disabled) {
  border-color: #f97316;
  background: #fff7ed;
  color: #c2410c;
  transform: translateY(-1px);
}

.location-button:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.locating-spinner { display: inline-block; animation: spin 1s linear infinite; }

/* ── Suggestions ── */
.search-suggestions {
  max-width: 560px;
  margin: 0 auto 6px;
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
  gap: 1px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.search-suggestion-item:last-child { border-bottom: none; }
.search-suggestion-item:hover { background: #fff7ed; }
.search-suggestion-primary { font-size: 0.93rem; font-weight: 600; color: #111827; }
.search-suggestion-secondary { font-size: 0.78rem; color: #6b7280; }

.search-error {
  text-align: center;
  margin: 8px auto 0;
  font-size: 0.95rem;
  color: #b91c1c;
}

/* ── Geo picker ── */
.geo-picker {
  margin: 12px auto 0;
  padding: 12px 16px;
  background: rgba(255, 249, 240, 0.95);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.geo-picker-label { font-size: 0.9rem; font-weight: 600; margin: 0 0 8px; color: #374151; }
.geo-picker-buttons { display: flex; flex-wrap: wrap; gap: 8px; }

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

.geo-picker-btn:hover { background: #fff7ed; }

/* ── UV results ── */
.uv-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
}

.result-location {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  text-align: center;
}

/* UV circle */
.uv-circle-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.uv-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 8px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}

.uv-circle-eyebrow {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 2px;
}

.uv-index-num {
  font-size: 3.2rem;
  font-weight: 800;
  line-height: 1;
  transition: color 0.4s ease;
}

.uv-risk-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  margin-top: 4px;
}

/* UV scale */
.uv-scale-widget {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.uv-scale-bar {
  display: flex;
  border-radius: 999px;
  overflow: hidden;
  height: 34px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.uv-scale-seg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.25);
  letter-spacing: 0.02em;
  user-select: none;
}

.seg-low  { background: #22c55e; }
.seg-mod  { background: #eab308; color: #1c1917; text-shadow: none; }
.seg-high { background: #f97316; }
.seg-very { background: #ef4444; }
.seg-ext  { background: #a855f7; }

.uv-scale-track {
  position: relative;
  height: 22px;
  margin: 0 2px;
}

.uv-scale-indicator {
  position: absolute;
  top: 0;
  width: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: left 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.uv-scale-indicator::before {
  content: "";
  width: 2px;
  height: 10px;
  background: #111827;
  border-radius: 2px;
}

.uv-scale-indicator-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.uv-scale-numbers {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  font-size: 0.7rem;
  color: #9ca3af;
  font-weight: 500;
}

/* Warning message */
.uv-message-box {
  width: 100%;
  max-width: 480px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 2px solid transparent;
  font-size: 0.93rem;
  text-align: center;
  line-height: 1.5;
}

/* ── 24-hour UV chart ── */
.uv-chart-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 249, 240, 0.97);
  border-radius: 22px;
  padding: 18px 18px 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.09);
  border: 1px solid rgba(249, 115, 22, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* top row */
.uv-chart-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.uv-chart-title-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.uv-chart-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9ca3af;
}

.uv-chart-peak-time {
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0;
}

.uv-chart-peak-badge {
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 12px;
  white-space: nowrap;
}

/* tooltip strip */
.uv-chart-tooltip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 14px;
  min-height: 36px;
  transition: border-color 0.2s;
}

.uv-chart-tooltip.visible {
  border-color: rgba(249, 115, 22, 0.35);
}

.uv-tooltip-time {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}

.uv-tooltip-value {
  font-size: 0.9rem;
  font-weight: 800;
}

.uv-tooltip-risk {
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 500;
}

.uv-tooltip-hint {
  font-size: 0.78rem;
  color: #d1d5db;
  font-style: italic;
}

/* chart body: y-axis + bars */
.uv-chart-body {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.uv-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 500;
  padding-bottom: 18px; /* align with x labels */
  gap: 0;
  min-width: 18px;
}

.uv-bars-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
  height: 130px;
  gap: 2px;
}

/* grid lines */
.uv-grid {
  position: absolute;
  inset: 0 0 18px 0; /* leave room for x labels */
  pointer-events: none;
}

.uv-grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  transform: translateY(1px);
}

/* bar columns */
.uv-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  cursor: crosshair;
  border-radius: 4px;
  transition: background 0.15s;
  padding-bottom: 18px; /* space for x label */
  position: relative;
}

.uv-bar-col:hover,
.uv-bar-col--hovered {
  background: rgba(249, 115, 22, 0.06);
}

.uv-bar-col--now > .uv-bar-fill {
  outline: 2px solid rgba(249, 115, 22, 0.6);
  outline-offset: 1px;
}

.uv-bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s;
  min-height: 2px;
}

.uv-bar-x-label {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.58rem;
  color: #9ca3af;
  font-weight: 500;
  white-space: nowrap;
  line-height: 16px;
}

.uv-bar-x-label--now {
  color: #f97316;
  font-weight: 700;
}

/* legend */
.uv-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  justify-content: center;
}

.uv-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #6b7280;
  font-weight: 500;
}

.uv-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Nudge prompt ── */
.nudge-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(255, 247, 237, 0.9);
  border: 2px dashed #f97316;
  border-radius: 16px;
  padding: 16px 20px;
  width: 100%;
  max-width: 480px;
  animation: nudgePulse 2.5s ease-in-out 3;
}

@keyframes nudgePulse {
  0%, 100% { background: rgba(255, 247, 237, 0.9); }
  50%       { background: rgba(249, 115, 22, 0.12); }
}

.nudge-icon { font-size: 1.4rem; animation: bounceDown 1.2s ease-in-out infinite; }

@keyframes bounceDown {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(5px); }
}

.nudge-text {
  font-size: 1rem;
  color: #c2410c;
  font-weight: 600;
  margin: 0;
}

/* ── Protection tiles ── */
.protection-tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  width: 100%;
  max-width: 480px;
}

.tile {
  background: rgba(255, 249, 240, 0.97);
  border-radius: 22px;
  padding: 28px 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(249, 115, 22, 0.18);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}

.tile:hover {
  border-color: rgba(249, 115, 22, 0.45);
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.15);
  transform: translateY(-3px);
}

.tile:active { transform: translateY(-1px); }

.tile-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tile-icon { font-size: 2.4rem; flex-shrink: 0; }

.tile-info { flex: 1; min-width: 0; }

.tile-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
}

.tile-hint {
  font-size: 0.88rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

.tile-arrow {
  font-size: 1rem;
  color: #f97316;
  font-weight: 700;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.tile:hover .tile-arrow { transform: translateX(3px); }

/* ── Bottom sheet modal ── */
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  background: #fff;
  border-radius: 28px 28px 0 0;
  padding: 32px 28px 48px;
  width: 100%;
  max-width: 600px;
  max-height: 88vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sheet-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.sheet-close:hover { background: #e5e7eb; }

.sheet-icon { font-size: 2.8rem; text-align: center; }

.sheet-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  text-align: center;
}

.sheet-subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  text-align: center;
}

.sheet-emojis {
  font-size: 1.6rem;
  letter-spacing: 0.2em;
  text-align: center;
}

.sheet-advice {
  background: #f9fafb;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.6;
  border: 1px solid #e5e7eb;
}

.sheet-reapply {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 16px;
  padding: 16px;
}

.sheet-reapply-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  font-weight: 600;
  margin: 0;
}

.sheet-reapply-value {
  font-size: 2rem;
  font-weight: 800;
  color: #f97316;
  margin: 0;
  line-height: 1;
}

.sheet-tips {
  background: #f9fafb;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
}

.sheet-tips-title {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin: 0 0 10px;
}

.sheet-tips-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sheet-tips-list li {
  font-size: 0.88rem;
  color: #374151;
  line-height: 1.4;
}

.sheet-reminder-btn {
  display: block;
  width: 100%;
  padding: 13px;
  border-radius: 14px;
  background: rgba(249, 115, 22, 0.1);
  border: 1.5px solid rgba(249, 115, 22, 0.35);
  color: #f97316;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}

.sheet-reminder-btn:hover {
  background: rgba(249, 115, 22, 0.18);
  transform: translateY(-1px);
}

.sheet-source {
  font-size: 0.75rem;
  color: #d1d5db;
  font-style: italic;
  text-align: center;
  margin: 0;
}

.sheet-enter-active, .sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }


/* ── Entrance animations ── */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-up {
  animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.results-enter-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.results-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* ── Overlays / popups ── */
.overlay {
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

.popup {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  padding: 36px 40px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  animation: popIn 0.25s ease;
}

.loading-popup { padding: 32px 36px 28px; }

.popup-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 8px;
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

.popup-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
}

.popup-text {
  font-size: 0.98rem;
  color: #4b5563;
  margin: 0 0 20px;
}

.popup-btn {
  padding: 10px 28px;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.popup-btn:hover { background: #ea580c; }

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

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn  { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

/* ── Responsive ── */
@media (max-width: 500px) {
  .protection-tiles { grid-template-columns: 1fr; }
  .page-title { font-size: 1.6rem; }
  .uv-circle { width: 140px; height: 140px; }
  .uv-index-num { font-size: 2.8rem; }
}
</style>
