<script setup>

import { ref, onMounted } from "vue"
import api from "../services/api"

const uvData = ref(null)
const error = ref(null)
const loading = ref(false)

const city = ref("")
const locationName = ref("")

let reminderTimer = null
const reminderEnabled = ref(false)

/*
-------------------------------------
UV COLOR LOGIC
-------------------------------------
*/

function getUVColor(index) {

  if (index <= 2) return "green"
  if (index <= 5) return "gold"
  if (index <= 7) return "orange"
  if (index <= 10) return "red"

  return "purple"

}

/*
-------------------------------------
BROWSER NOTIFICATIONS
-------------------------------------
*/

function enableNotifications() {

  if (!("Notification" in window)) return

  Notification.requestPermission()

}

/*
-------------------------------------
START REMINDER TIMER
-------------------------------------
*/

function startReminder(minutes) {

  if (!minutes) return

  const interval = minutes * 60000

  reminderTimer = setInterval(() => {

    new Notification("Sunscreen Reminder", {
      body: "Time to reapply sunscreen ☀"
    })

  }, interval)

}

/*
-------------------------------------
ENABLE REMINDER
-------------------------------------
*/

async function enableReminder() {

  if (!uvData.value || !uvData.value.reapply_minutes) {

    alert("UV guidance not available yet")

    return
  }

  const interval = Number(uvData.value.reapply_minutes)

  enableNotifications()

  try {

    await api.post("/api/reminder", {
      interval_minutes: interval
    })

    startReminder(interval)

    reminderEnabled.value = true

  } catch (err) {

    console.error("Reminder save failed", err)

  }

}

/*
-------------------------------------
DISABLE REMINDER
-------------------------------------
*/

async function disableReminder() {

  if (reminderTimer) {

    clearInterval(reminderTimer)

  }

  try {

    await api.post("/api/reminder/disable")

  } catch (err) {

    console.error(err)

  }

  reminderEnabled.value = false

}

/*
-------------------------------------
LOAD REMINDER FROM DATABASE
-------------------------------------
*/

async function loadReminder() {

  try {

    const res = await api.get("/api/reminder")

    if (res.data && res.data.is_active) {

      //startReminder(res.data.interval_minutes)
      startReminder(0.1)

      reminderEnabled.value = true

    }

  } catch (err) {

    console.log("No active reminder")

  }

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
USE CURRENT LOCATION
-------------------------------------
*/

function useMyLocation() {

  navigator.geolocation.getCurrentPosition((pos) => {

    const lat = pos.coords.latitude
    const lon = pos.coords.longitude

    locationName.value = "Current Location"

    fetchUV(lat, lon)

  })

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

  try {

    await api.get("/api/auth/user")

    loadReminder()

  } catch {

    console.log("User not logged in")

  }

})

</script>

<template>

<div class="container">

<h1>☀ UV Protection Dashboard</h1>

<div class="location-box">

<input v-model="city" placeholder="Search city"/>

<button @click="searchCity">
Search
</button>

<button @click="useMyLocation">
Use My Location
</button>

</div>

<p v-if="locationName">
📍 Location: {{ locationName }}
</p>

<div v-if="loading">
Fetching UV data...
</div>

<div v-if="error">
{{ error }}
</div>

<div v-if="uvData" class="card">

<h2 :style="{color: getUVColor(uvData.uv_index)}">
UV Index: {{ uvData.uv_index }}
</h2>

<p>
<strong>⚠ Risk Level:</strong>
{{ uvData.risk_level }}
</p>

<p>
<strong>👕 Clothing Advice:</strong>
{{ uvData.clothing }}
</p>

<p>
<strong>🧴 Sunscreen Advice:</strong>
{{ uvData.sunscreen }}
</p>

<p>
<strong>⏱ Reapply Every:</strong>
{{ uvData.reapply_minutes }} minutes
</p>

<div class="reminder-controls">

<button v-if="!reminderEnabled" @click="enableReminder">
🔔 Enable Reminder
</button>

<button v-if="reminderEnabled" @click="disableReminder">
🔕 Disable Reminder
</button>

</div>

</div>

</div>

</template>

<style>

.container {

max-width: 700px;
margin: auto;
padding: 40px;
font-family: Arial;

}

.location-box {

margin-bottom: 20px;

}

.location-box input {

padding: 8px;
margin-right: 10px;

}

.location-box button {

padding: 8px 12px;
margin-right: 10px;

}

.card {

background: #f5f5f5;
padding: 25px;
border-radius: 10px;
box-shadow: 0px 4px 10px rgba(0,0,0,0.1);

}

.reminder-controls {

margin-top: 20px;

}

.reminder-controls button {

padding: 10px 14px;
margin-right: 10px;

}

</style>