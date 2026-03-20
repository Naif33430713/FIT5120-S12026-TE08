<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { setAppUnlocked } from "../utils/authGate"

const APP_PASSWORD = "sunshield2026"

const route = useRoute()
const router = useRouter()

const password = ref("")
const error = ref("")
const shake = ref(false)

onMounted(() => {
  password.value = ""
})

function submit() {
  error.value = ""
  const entered = password.value.trim()
  if (entered !== APP_PASSWORD) {
    error.value = "That password doesn't match. Try again."
    shake.value = true
    setTimeout(() => { shake.value = false }, 400)
    return
  }
  setAppUnlocked()
  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/"
  router.replace(redirect.startsWith("/") ? redirect : "/")
}
</script>

<template>
  <div class="gate-root">
    <div class="gate-card" :class="{ shake }">
      <div class="gate-logo">
        <span class="gate-emoji">☀️</span>
        <span class="gate-brand">SunShield</span>
      </div>
      <h1 class="gate-title">Enter access code</h1>
      <p class="gate-subtitle">This preview is password protected.</p>

      <form class="gate-form" @submit.prevent="submit">
        <label class="gate-label" for="gate-password">Password</label>
        <input
          id="gate-password"
          v-model="password"
          type="password"
          class="gate-input"
          placeholder="Enter access code"
          autocomplete="current-password"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          autofocus
        />
        <p v-if="error" class="gate-error">{{ error }}</p>
        <button type="submit" class="gate-btn">Unlock SunShield</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.gate-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #fffbea 0%, #ffe8c2 55%, #ffd4a8 100%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.gate-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 36px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.12);
}

.gate-card.shake {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.gate-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.gate-emoji { font-size: 2rem; }

.gate-brand {
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}

.gate-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #111827;
  text-align: center;
  margin: 0 0 8px;
}

.gate-subtitle {
  font-size: 0.92rem;
  color: #6b7280;
  text-align: center;
  margin: 0 0 24px;
  line-height: 1.5;
}

.gate-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gate-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
}

.gate-input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  font-size: 1rem;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.gate-input:focus {
  border-color: #f97316;
}

.gate-error {
  font-size: 0.85rem;
  color: #b91c1c;
  margin: 0;
}

.gate-btn {
  margin-top: 8px;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(249, 115, 22, 0.35);
  transition: filter 0.2s, transform 0.15s;
}

.gate-btn:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}
</style>
