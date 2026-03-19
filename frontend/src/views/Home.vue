<script setup>
import { RouterLink } from "vue-router"
</script>

<template>
  <div class="home-root">
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
        <RouterLink to="/" class="app-nav-link app-nav-link--active">Home</RouterLink>
        <RouterLink to="/dashboard" class="app-nav-link">Dashboard</RouterLink>
        <RouterLink to="/reminder" class="app-nav-link">Reminder</RouterLink>
        <RouterLink to="/about" class="app-nav-link">About</RouterLink>
      </nav>
    </header>

    <main class="home-main">
      <section class="hero">
        <!-- LEFT COLUMN -->
        <div class="hero-left">
          <div class="hero-badge animate-up" style="--delay: 0.05s">
            <span class="hero-badge-dot"></span>
            Live UV data · Australia-wide
          </div>

          <h1 class="hero-title animate-up" style="--delay: 0.18s">
            SunShield <br />
            <span class="hero-highlight">Know Before You Glow.</span>
          </h1>

          <p class="hero-subtitle animate-up" style="--delay: 0.3s">
            UV radiation is invisible — but the damage isn't. Get real-time UV levels for any Australian suburb and personalised sun protection advice, backed by Cancer Council Australia guidelines.
          </p>

          <div class="hero-stat-pill animate-up" style="--delay: 0.42s">
            <span class="stat-icon">⚠️</span>
            <span>Australia's UV levels are among the highest in the world — and UV radiation is invisible until the damage is done</span>
          </div>

        </div>

        <!-- RIGHT COLUMN — how it works -->
        <div class="hero-right">
          <div class="hero-card animate-in-right" style="--delay: 0.28s">
            <p class="how-title">How it works</p>

            <div class="steps">
              <div class="step animate-up" style="--delay: 0.42s">
                <div class="step-icon">📍</div>
                <div class="step-body">
                  <p class="step-label">Enter your suburb</p>
                  <p class="step-desc">Type any Australian suburb or postcode</p>
                </div>
              </div>
              <div class="step-connector" aria-hidden="true"></div>
              <div class="step animate-up" style="--delay: 0.54s">
                <div class="step-icon">☀️</div>
                <div class="step-body">
                  <p class="step-label">See your UV risk</p>
                  <p class="step-desc">Colour-coded risk level + today's peak UV</p>
                </div>
              </div>
              <div class="step-connector" aria-hidden="true"></div>
              <div class="step animate-up" style="--delay: 0.66s">
                <div class="step-icon">🧴</div>
                <div class="step-body">
                  <p class="step-label">Get your plan</p>
                  <p class="step-desc">Sunscreen dosage, clothing tips, and 5-day forecast</p>
                </div>
              </div>
            </div>

            <div class="card-cta-zone animate-up" style="--delay: 0.78s">
              <RouterLink to="/dashboard" class="btn-primary">
                Check My UV Now
                <span class="btn-arrow">→</span>
              </RouterLink>
              <RouterLink to="/about" class="btn-secondary">Learn More</RouterLink>
            </div>
            <p class="cta-hint animate-up" style="--delay: 0.88s">
              Takes 10 seconds · Any suburb in Australia
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-root {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(160deg, #fffbea 0%, #ffe8c2 55%, #ffd4a8 100%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #111827;
}

/* ── Background floating emojis ── */
.bg-emojis {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

@keyframes bgEmojiFloat {
  0%   { opacity: 0;    transform: translateY(0px) scale(0.9); }
  20%  { opacity: 0.13; transform: translateY(-6px) scale(1); }
  50%  { opacity: 0.10; transform: translateY(-12px) scale(1.05); }
  80%  { opacity: 0.13; transform: translateY(-6px) scale(1); }
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

/* ── Nav ── */
.app-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}

.app-logo {
  font-weight: 800;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-logo-emoji { font-size: 1.5rem; }
.app-logo-text  { letter-spacing: 0.02em; }

.app-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-nav-link {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
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

/* ── Layout ── */
.home-main {
  position: relative;
  z-index: 1;
  max-width: 1020px;
  margin: 0 auto;
  padding: 0 28px 64px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 48px;
  align-items: center;
  padding: 60px 0 40px;
  min-height: 82vh;
}

/* ── Hero left ── */
.hero-left {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #92400e;
  background: rgba(251, 191, 36, 0.25);
  border: 1px solid rgba(251, 191, 36, 0.5);
  padding: 5px 12px;
  border-radius: 999px;
  width: fit-content;
  margin-bottom: 18px;
}

.hero-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  animation: livePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}

.hero-title {
  font-size: 3.6rem;
  font-weight: 900;
  line-height: 1.05;
  margin: 0 0 18px;
  letter-spacing: -0.02em;
}

.hero-highlight {
  color: #f97316;
  font-style: italic;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: #4b5563;
  line-height: 1.65;
  margin: 0 0 20px;
  max-width: 460px;
}

.hero-subtitle strong {
  color: #b45309;
  font-weight: 700;
}

/* Stat pill */
.hero-stat-pill {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.88rem;
  color: #7f1d1d;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 28px;
  max-width: 400px;
}

.stat-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}


.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 15px 30px;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
  transition: background 0.15s, box-shadow 0.15s, transform 0.12s;
  animation: ctaPulse 3s ease-in-out infinite;
}

@keyframes ctaPulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4); }
  50%       { box-shadow: 0 6px 28px rgba(249, 115, 22, 0.6); }
}

.btn-primary:hover {
  background: #ea580c;
  box-shadow: 0 8px 28px rgba(249, 115, 22, 0.5);
  transform: translateY(-2px);
  animation: none;
}


.btn-arrow {
  font-size: 1.1rem;
  transition: transform 0.15s;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(3px);
}

.btn-secondary {
  padding: 14px 24px;
  border-radius: 999px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.7);
  color: #374151;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s, transform 0.12s;
}

.btn-secondary:hover {
  border-color: #f97316;
  background: #fff7ed;
  color: #c2410c;
  transform: translateY(-1px);
}

.cta-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0;
}

/* ── Hero right — UV preview card ── */
.hero-right {
  display: flex;
  justify-content: center;
}

.hero-card {
  width: 100%;
  max-width: 320px;
  border-radius: 24px;
  background: rgba(255, 252, 245, 0.97);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.14);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.how-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9ca3af;
  margin: 0;
  text-align: center;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.step-icon {
  font-size: 1.5rem;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(249, 115, 22, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-body {
  padding-top: 4px;
}

.step-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px;
}

.step-desc {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.step-connector {
  width: 2px;
  height: 18px;
  background: linear-gradient(to bottom, #fed7aa, #fde68a);
  border-radius: 2px;
  margin: 4px 0 4px 21px;
}

.card-cta-zone {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-cta-zone .btn-primary,
.card-cta-zone .btn-secondary {
  display: flex;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  padding: 13px 20px;
  font-size: 0.97rem;
}


/* ── Entrance animations ── */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(36px); }
  to   { opacity: 1; transform: translateX(0); }
}

.animate-up {
  animation: slideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.animate-in-right {
  animation: slideInRight 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

/* ── Responsive ── */
@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 36px 0 28px;
    min-height: unset;
    gap: 32px;
  }

  .hero-title {
    font-size: 2.6rem;
  }

  .hero-right {
    justify-content: flex-start;
  }

  .hero-card {
    max-width: 100%;
  }

}
</style>
