<script setup>
import { RouterLink } from "vue-router"
import { useReminder } from "../composables/useReminder"

const {
  reminderEnabled,
  reminderInterval,
  testMode,
  countdownDisplay,
  effectiveMinutes,
  enableReminder,
  disableReminder,
  startReminder,
} = useReminder()

function toggleTestMode() {
  testMode.value = !testMode.value
  // restart timer immediately if already enabled so new interval takes effect
  if (reminderEnabled.value) startReminder()
}
</script>

<template>
  <div class="reminder-root">

    <!-- Navbar (identical pattern to other pages) -->
    <header class="app-header">
      <div class="app-logo">
        <span class="app-logo-emoji">☀️</span>
        <span class="app-logo-text">SunShield</span>
      </div>
      <nav class="app-nav">
        <RouterLink to="/"          class="app-nav-link">Home</RouterLink>
        <RouterLink to="/dashboard" class="app-nav-link">Dashboard</RouterLink>
        <RouterLink to="/reminder"  class="app-nav-link app-nav-link--active">Reminder</RouterLink>
        <RouterLink to="/about"     class="app-nav-link">About</RouterLink>
      </nav>
    </header>

    <main class="reminder-page">

      <div class="page-header animate-up" style="--delay: 0.05s">
        <p class="page-kicker">☀️ sun safety, but make it easy</p>
        <h1 class="page-title">Don't forget to <span class="title-highlight">reapply.</span></h1>
        <p class="page-subtitle">
          Set it and forget it — we'll ping you when it's time to reapply your SPF.
        </p>
      </div>

      <!-- Main card -->
      <div class="reminder-card animate-up" style="--delay: 0.15s">

        <!-- Status chip -->
        <div class="status-chip-row">
          <span :class="reminderEnabled ? 'status-chip status-chip--on' : 'status-chip status-chip--off'">
            <span class="status-chip-dot"></span>
            {{ reminderEnabled ? "Reminder ON" : "Reminder OFF" }}
          </span>
        </div>

        <!-- Countdown hero — big display when active -->
        <Transition name="fade">
          <div v-if="reminderEnabled" class="countdown-hero">
            <p class="countdown-hero-label">reapplying in</p>
            <p class="countdown-hero-time">{{ countdownDisplay }}</p>
            <p class="countdown-hero-sub">Every {{ effectiveMinutes }} min · SPF 50+</p>
          </div>
        </Transition>

        <!-- Interval (read-only) -->
        <div class="reminder-field">
          <label class="reminder-label">Your reapply interval 🕒</label>
          <div class="reminder-interval-display">
            Every {{ testMode ? 1 : reminderInterval }} minutes
            {{ reminderInterval === 120 && !testMode ? "· recommended by Cancer Council 🇦🇺" : "" }}
          </div>
          <p class="reminder-interval-note">
            Auto-set from your UV data. Search a location on Dashboard to update it.
          </p>
        </div>

        <!-- Test mode -->
        <label class="reminder-checkbox-row" :class="{ 'checkbox-disabled': reminderEnabled }">
          <input
            type="checkbox"
            :checked="testMode"
            class="reminder-checkbox"
            @change="toggleTestMode"
          />
          <span class="reminder-checkbox-label">
            🧪 Test mode <span class="test-badge">(fires in 1 min — try it!)</span>
          </span>
        </label>

        <!-- Enable / Disable button -->
        <button
          v-if="!reminderEnabled"
          class="reminder-btn reminder-btn--enable"
          @click="enableReminder(null)"
        >
          🔔 Start reminder
        </button>
        <button
          v-else
          class="reminder-btn reminder-btn--disable"
          @click="disableReminder"
        >
          🔕 Turn off reminder
        </button>

        <!-- Tips -->
        <div class="reminder-tips">
          <p class="reminder-tips-title">no cap — here's why reapplying matters 👇</p>
          <ul class="reminder-tips-list">
            <li>☀️ Sunscreen breaks down after {{ reminderInterval }} min of sun exposure</li>
            <li>💦 Sweat & swimming cut that time in half</li>
            <li>🔁 Reapplying = just as important as the first layer</li>
            <li>🧴 Go SPF 50+ broad-spectrum, always</li>
          </ul>
        </div>

        <RouterLink to="/dashboard" class="reminder-back">← back to dashboard</RouterLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ── Root ── */
.reminder-root {
  min-height: 100vh;
  background: linear-gradient(160deg, #fef9c3 0%, #fde68a 100%);
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #111827;
}

/* ── Navbar — mirrors Dashboard.vue exactly ── */
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

/* ── Page layout ── */
.reminder-page {
  max-width: 560px;
  margin: 0 auto;
  padding: 0 16px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.page-header {
  text-align: center;
  padding: 36px 0 8px;
}

.page-kicker {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #f97316;
  margin: 0 0 10px;
}

.page-title {
  font-size: 2rem;
  font-weight: 900;
  color: #111827;
  margin: 0 0 10px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.title-highlight {
  background: linear-gradient(135deg, #f97316, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 0.97rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.65;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-up {
  opacity: 0;
  animation: slideUp 0.5s ease both;
  animation-delay: var(--delay, 0s);
}

/* ── Card ── */
.reminder-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.93);
  border-radius: 28px;
  padding: 28px 26px;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── Status chip ── */
.status-chip-row {
  display: flex;
  justify-content: center;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.status-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-chip--on {
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
  border: 1.5px solid rgba(34, 197, 94, 0.3);
}

.status-chip--on .status-chip-dot {
  background: #22c55e;
  animation: livePulse 1.5s ease-in-out infinite;
}

.status-chip--off {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1.5px solid rgba(107, 114, 128, 0.2);
}

.status-chip--off .status-chip-dot { background: #9ca3af; }

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(1.35); }
}

/* ── Countdown hero ── */
.countdown-hero {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(239, 68, 68, 0.08));
  border: 1.5px solid rgba(249, 115, 22, 0.2);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.countdown-hero-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin: 0;
}

.countdown-hero-time {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #f97316, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
  margin: 0;
  line-height: 1.1;
}

.countdown-hero-sub {
  font-size: 0.82rem;
  color: #9ca3af;
  font-weight: 500;
  margin: 0;
}

/* ── Interval display ── */
.reminder-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reminder-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
}

.reminder-interval-display {
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
}

.reminder-interval-note {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
}

/* ── Checkbox ── */
.reminder-checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.checkbox-disabled { opacity: 0.5; pointer-events: none; }

.reminder-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #f97316;
  cursor: pointer;
}

.reminder-checkbox-label {
  font-size: 0.92rem;
  font-weight: 600;
  color: #111827;
}

.test-badge {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

/* ── Buttons ── */
.reminder-btn {
  width: 100%;
  padding: 13px;
  border-radius: 999px;
  border: none;
  font-size: 0.97rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}

.reminder-btn--enable {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.38);
  font-size: 1rem;
  letter-spacing: 0.01em;
}

.reminder-btn--enable:hover {
  filter: brightness(1.07);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(34, 197, 94, 0.45);
}

.reminder-btn--disable {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: #fff;
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.33);
  font-size: 1rem;
}

.reminder-btn--disable:hover {
  filter: brightness(1.07);
  transform: translateY(-2px);
}

/* ── Countdown strip ── */
.countdown-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(249, 115, 22, 0.07);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 14px;
  padding: 14px 18px;
}

.countdown-label {
  font-size: 0.88rem;
  color: #92400e;
  font-weight: 500;
}

.countdown-time {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f97316;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

/* ── Tips ── */
.reminder-tips {
  background: rgba(255, 247, 237, 0.9);
  border: 1px solid rgba(249, 115, 22, 0.15);
  border-radius: 18px;
  padding: 18px 20px;
}

.reminder-tips-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: #92400e;
  margin: 0 0 10px;
  letter-spacing: -0.01em;
}

.reminder-tips-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.reminder-tips-list li {
  font-size: 0.88rem;
  color: #6b7280;
  line-height: 1.5;
}

/* ── Back link ── */
.reminder-back {
  font-size: 0.82rem;
  color: #9ca3af;
  text-decoration: none;
  text-align: center;
  transition: color 0.2s;
  font-weight: 500;
}

.reminder-back:hover { color: #f97316; }

/* ── Transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from  { opacity: 0; transform: translateY(8px); }
.fade-leave-to    { opacity: 0; transform: translateY(8px); }

/* ── Responsive ── */
@media (max-width: 480px) {
  .app-header { padding: 12px 16px; }
  .reminder-card { padding: 22px 16px; }
}
</style>
