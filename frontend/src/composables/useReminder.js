/**
 * Global singleton reminder state.
 * Refs are declared at module scope so they persist across all component instances.
 */
import { ref, computed } from "vue"

const reminderEnabled  = ref(false)
const reminderInterval = ref(120)   // minutes — set from uvData.reapply_minutes
const testMode         = ref(false)
const reminderFired    = ref(false)
const secondsLeft      = ref(0)

let reminderTimer  = null
let countdownTimer = null

const effectiveMinutes = computed(() =>
  testMode.value ? 1 : reminderInterval.value
)

const countdownDisplay = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${m}:${String(s).padStart(2, "0")}`
})

function startReminder() {
  stopReminder()
  const ms = effectiveMinutes.value * 60 * 1000
  secondsLeft.value = effectiveMinutes.value * 60

  reminderTimer = setTimeout(() => {
    reminderFired.value = true
  }, ms)

  countdownTimer = setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value--
  }, 1000)
}

function stopReminder() {
  if (reminderTimer)  { clearTimeout(reminderTimer);  reminderTimer  = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  secondsLeft.value = 0
}

/**
 * Enable reminder.
 * @param {number|null} intervalMinutes - from uvData.reapply_minutes; uses existing value if null
 */
function enableReminder(intervalMinutes) {
  if (intervalMinutes != null) reminderInterval.value = intervalMinutes
  reminderEnabled.value = true
  reminderFired.value   = false
  startReminder()
}

function disableReminder() {
  reminderEnabled.value = false
  reminderFired.value   = false
  stopReminder()
}

/** Called when user dismisses the popup — restarts the cycle */
function dismissPopup() {
  reminderFired.value = false
  startReminder()
}

export function useReminder() {
  return {
    reminderEnabled,
    reminderInterval,
    testMode,
    reminderFired,
    secondsLeft,
    effectiveMinutes,
    countdownDisplay,
    enableReminder,
    disableReminder,
    dismissPopup,
    startReminder,
    stopReminder,
  }
}
