<script setup>
import { useReminder } from "./composables/useReminder"

const {
  reminderEnabled,
  reminderFired,
  reminderInterval,
  effectiveMinutes,
  countdownDisplay,
  dismissPopup,
  disableReminder,
} = useReminder()
</script>

<template>
  <!-- Global reminder pill — shown on every page while active -->
  <Transition name="pill">
    <div v-if="reminderEnabled" class="global-reminder-pill">
      <span class="pill-dot"></span>
      🔔 Reminder active — reapply in <strong>{{ countdownDisplay }}</strong>
      <button class="pill-disable-btn" @click="disableReminder" aria-label="Disable reminder">✕</button>
    </div>
  </Transition>

  <!-- Page content -->
  <router-view v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </router-view>

  <!-- Global reapply popup — shown on every page when alarm fires -->
  <Transition name="popup">
    <div v-if="reminderFired" class="global-overlay" @click.self="dismissPopup">
      <div class="global-popup">
        <div class="popup-icon">🧴</div>
        <h2 class="popup-title">Time to Reapply!</h2>
        <p class="popup-text">
          It's been {{ effectiveMinutes }} {{ effectiveMinutes === 1 ? "minute" : "minutes" }} —
          reapply your SPF 50+ sunscreen now to stay protected.
        </p>
        <button class="popup-btn" @click="dismissPopup">
          ✅ Done — restart timer
        </button>
      </div>
    </div>
  </Transition>
</template>

<style>
/* ── Page transition ── */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.page-enter-from { opacity: 0; transform: translateY(14px); }
.page-leave-to   { opacity: 0; transform: translateY(-8px); }

/* ── Global reminder pill ── */
.global-reminder-pill {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid rgba(34, 197, 94, 0.5);
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #166534;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
  white-space: nowrap;
  backdrop-filter: blur(8px);
}

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
  animation: livePulse 1.5s ease-in-out infinite;
}

.pill-disable-btn {
  margin-left: 8px;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.65rem;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
  line-height: 1;
}

.pill-disable-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(1.35); }
}

/* ── Pill transition ── */
.pill-enter-active, .pill-leave-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.pill-enter-from, .pill-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px) scale(0.92);
}

/* ── Global overlay ── */
.global-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 24px;
}

.global-popup {
  background: #fff;
  border-radius: 28px;
  padding: 36px 32px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.popup-icon {
  font-size: 3rem;
  animation: popBounce 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes popBounce {
  0%   { transform: scale(0.4); opacity: 0; }
  65%  { transform: scale(1.18); }
  100% { transform: scale(1);   opacity: 1; }
}

.popup-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.popup-text {
  font-size: 0.92rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.popup-btn {
  width: 100%;
  padding: 13px;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: #fff;
  font-size: 0.97rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);
}

.popup-btn:hover {
  background: #ea6c0a;
  transform: translateY(-1px);
}

/* ── Popup transition ── */
.popup-enter-active, .popup-leave-active { transition: opacity 0.25s ease; }
.popup-enter-from, .popup-leave-to { opacity: 0; }
</style>
