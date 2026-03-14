<script setup>

import { ref, onMounted, onBeforeUnmount } from "vue"
import { RouterLink } from "vue-router"
import api from "../services/api"

const uvData = ref(null)
const error = ref(null)
const loading = ref(false)

const city = ref("")
const locationName = ref("")

let reminderTimer = null
let countdownTimer = null
const reminderEnabled = ref(false)
const showProtection = ref(false)
const testMode = ref(false)
const reminderFired = ref(false)
const nextFireTime = ref(null)
const countdownDisplay = ref("")
const reminderIntervalMinutesKey = "sunscreenReminderIntervalMinutes"
const reminderEnabledKey = "sunscreenReminderEnabled"

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

  if (!uvData.value) {

    alert("UV guidance not available yet")

    return
  }

  const interval = testMode.value ? 1 : Number(uvData.value.reapply_minutes || 0)

  if (!interval) {

    alert("UV guidance not available yet")

    return
  }

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

  try {

    const res = await api.get(`/api/uv?lat=${lat}&lon=${lon}`)

    uvData.value = res.data

  } catch (err) {

    console.error(err)
    error.value = "Failed to fetch UV data"

  }

  loading.value = false

}

/*
-------------------------------------
SEARCH CITY
-------------------------------------
*/

async function searchCity() {

  if (!city.value) return

  loading.value = true

  try {

    const geo = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city.value}&limit=1&appid=f5cb1e66fd5a5900bd73dfd9c44705ea`
    )

    const data = await geo.json()

    if (!data.length) {

      error.value = "City not found"
      loading.value = false
      return

    }

    const lat = data[0].lat
    const lon = data[0].lon

    locationName.value = data[0].name

    fetchUV(lat, lon)

  } catch (err) {

    error.value = "City lookup failed"

  }

  loading.value = false

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

})

</script>

<template>
  <div class="dashboard-root">
    <header class="app-header">
      <div class="app-logo">
        <span class="app-logo-emoji">☀️</span>
        <span class="app-logo-text">SunShield</span>
      </div>
      <nav class="app-nav">
        <RouterLink to="/" class="app-nav-link app-nav-link--active">
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
          </div>
        </div>
      </section>

      <section class="search-bar">
        <input
          v-model="city"
          class="search-input"
          placeholder="Search your Suburb"
        />
        <button class="search-button" @click="searchCity">
          🔍 Search
        </button>
      </section>

      <section v-if="uvData" class="uv-section">
        <div class="uv-circle-wrapper">
          <div class="uv-circle">
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
            {{ uvData.risk_level }} Risk
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
            <div class="protection-columns">
              <div class="dosage-card">
                <h3 class="section-title">Sunscreen Dosage</h3>
                <p class="dosage-uv">
                  Current UV Index {{ uvData.uv_index }} ({{ uvData.risk_level }})
                </p>
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

              <div class="clothing-card">
                <h3 class="section-title">Clothing Recommendations</h3>
                <p class="clothing-uv">
                  {{ uvData.risk_level }} (UV {{ uvData.uv_index }})
                </p>
                <p class="clothing-text">
                  {{ uvData.clothing }}
                </p>
              </div>
            </div>

            <div class="protection-reminder">
              <p class="reminder-label">Sunscreen Reminders</p>
              <div class="reminder-controls">
                <button
                  v-if="!reminderEnabled && uvData.uv_index >= 3"
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
                  v-if="uvData.uv_index >= 3"
                  class="reminder-test-mode"
                >
                  <input
                    v-model="testMode"
                    type="checkbox"
                    :disabled="reminderEnabled"
                  />
                  Test mode (1 min)
                </label>
                <p v-if="uvData.uv_index < 3" class="reminder-note">
                  UV is low right now; reminders are not needed.
                </p>
              </div>
              <p v-if="reminderEnabled && countdownDisplay" class="reminder-countdown">
                Next reminder in {{ countdownDisplay }}
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>

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
  min-height: 100vh;
  background: linear-gradient(180deg, #fff7c4, #ffe0c2);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #222;
}

.app-header {
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
  width: 260px;
  border-radius: 24px;
  background: rgba(255, 249, 240, 0.95);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  padding: 24px 20px;
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

.search-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 8px auto 8px;
  max-width: 480px;
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
  max-width: 320px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid #d4d4d4;
  font-size: 0.95rem;
}

.search-button {
  padding: 10px 16px;
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
  text-align: center;
  color: #fff;
  font-weight: 700;
  background: #f97316;
}

.uv-risk-text {
  font-size: 0.98rem;
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

.protection-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
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

.dosage-uv,
.clothing-uv {
  font-size: 0.9rem;
  color: #4b5563;
  margin-bottom: 6px;
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

.clothing-text {
  font-size: 0.95rem;
}

.protection-reminder {
  margin-top: 12px;
}

.reminder-label {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.reminder-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.reminder-button {
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.reminder-button-off {
  background: #9ca3af;
}

.reminder-button:hover {
  opacity: 0.9;
}

.reminder-note {
  font-size: 0.85rem;
  color: #6b7280;
}

.reminder-test-mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
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
  margin-top: 8px;
  font-size: 0.9rem;
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
}
</style>