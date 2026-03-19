<script setup>
import { RouterLink } from "vue-router"
</script>

<template>
  <div class="about-root">
    <header class="app-header">
      <div class="app-logo">
        <span class="app-logo-emoji">☀️</span>
        <span class="app-logo-text">SunShield</span>
      </div>
      <nav class="app-nav">
        <RouterLink to="/" class="app-nav-link">Home</RouterLink>
        <RouterLink to="/dashboard" class="app-nav-link">Dashboard</RouterLink>
        <RouterLink to="/reminder" class="app-nav-link">Reminder</RouterLink>
        <RouterLink to="/about" class="app-nav-link app-nav-link--active">About</RouterLink>
      </nav>
    </header>

    <div class="about-content">
    <section class="about-card animate-up">
      <h1 class="about-title">About SunShield</h1>
      <p class="about-intro">
        SunShield is a UV awareness and prevention app designed for young Australians
        in Victoria who are navigating new tanning trends and social media influences.
        It turns invisible UV radiation into clear, relatable guidance so you and your
        friends can stay sun safe without giving up your lifestyle.
      </p>

      <div class="about-grid">
        <div class="about-section animate-up" style="--delay: 0.15s">
          <h2>The problem we&apos;re tackling</h2>
          <ul>
            <li>
              In Australia, UV levels are among the highest in the world, but UV
              radiation is invisible and often doesn&apos;t feel dangerous, especially on
              cool or windy days.
            </li>
            <li>
              Many Gen Z and Gen Alpha are chasing viral tan trends and treating
              sunburn as a status symbol, underestimating long‑term risks like skin
              cancer and premature ageing.
            </li>
            <li>
              Traditional health messages struggle to compete with fast, visual
              social media content, so young adults need tools that fit the way they
              already live and share information.
            </li>
          </ul>
        </div>

        <div class="about-section animate-up" style="--delay: 0.25s">
          <h2>How SunShield helps</h2>
          <p>
            SunShield focuses on two key areas: tracking UV levels and supporting
            preventive behaviours.
          </p>
          <ul>
            <li>
              <strong>Make the invisible visible:</strong> We show live UV levels for
              your location and translate them into human language alerts (for
              example, &quot;Your skin may start burning in 12 minutes – find shade
              now&quot;), with clear colour coding for Low–Extreme risk.
            </li>
            <li>
              <strong>Turn knowledge into action:</strong> We provide sunscreen
              dosage guidance in practical amounts (like teaspoons or pumps),
              reminders to reapply, and clothing recommendations based on the UV
              index so you can plan your outfit and outdoor time with confidence.
            </li>
            <li>
              <strong>Empower you and your friends:</strong> By making UV data
              understandable and shareable, SunShield aims to help you become a
              sun‑safety influencer within your group, turning reapplication and
              protection into a shared habit rather than a solo chore.
            </li>
          </ul>
        </div>
      </div>

      <div class="about-sources animate-up" style="--delay: 0.35s">
        <h2>Data &amp; research sources</h2>
        <p class="sources-intro">
          SunShield combines live environmental data with evidence‑based health guidance.
          Below are the sources we rely on.
        </p>
        <div class="sources-grid">
          <div class="source-item">
            <span class="source-icon">🌤️</span>
            <div>
              <strong>OpenWeatherMap – One Call API 3.0</strong>
              <p>
                Provides the live UV index, hourly forecast data (used to find today's peak UV hour),
                daily 5‑day forecast (weather conditions, max temperature, daily UV index),
                and sunrise/sunset times.
                <a href="https://openweathermap.org/api/one-call-3" target="_blank" rel="noopener">openweathermap.org</a>
              </p>
            </div>
          </div>
          <div class="source-item">
            <span class="source-icon">📍</span>
            <div>
              <strong>Nominatim / OpenStreetMap Geocoding</strong>
              <p>
                Powers the location search typeahead, translating suburb, city, or postcode
                text into geographic coordinates. Results are filtered to Australia.
                <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noopener">nominatim.openstreetmap.org</a>
              </p>
            </div>
          </div>
          <div class="source-item">
            <span class="source-icon">🗺️</span>
            <div>
              <strong>OpenStreetMap map tiles (via Leaflet)</strong>
              <p>
                The interactive map on the dashboard is rendered using OpenStreetMap tile imagery
                and the Leaflet mapping library.
                <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">openstreetmap.org</a>
              </p>
            </div>
          </div>
          <div class="source-item">
            <span class="source-icon">🎗️</span>
            <div>
              <strong>Cancer Council Australia – SunSmart</strong>
              <p>
                All sunscreen dosage recommendations (SPF 50+, application amounts, re‑application
                intervals), clothing advice, and the "five ways to be SunSmart" framework are
                derived from Cancer Council Australia's SunSmart guidelines.
                <a href="https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety" target="_blank" rel="noopener">cancer.org.au – Sun Safety</a>
              </p>
            </div>
          </div>
          <div class="source-item">
            <span class="source-icon">🌍</span>
            <div>
              <strong>WHO UV Index Classification</strong>
              <p>
                The UV risk categories (Low, Moderate, High, Very High, Extreme) and their
                numeric thresholds are based on the World Health Organization's international
                UV Index standard.
                <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index" target="_blank" rel="noopener">who.int – UV Index</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="about-legal animate-up" style="--delay: 0.45s">
      <div class="about-section">
        <h2>Privacy Statement</h2>
        <p>
          SunShield collects limited personal information such as your email, username, location, and reminder settings so we can provide personalised UV updates, sunscreen reminders, and clothing recommendations. We only use this information to run and improve the website. We do not sell your data, and we take reasonable steps to keep it secure.
        </p>
      </div>

      <div class="about-section">
        <h2>Terms of Use</h2>
        <p>
          SunShield provides general sun-safety information for awareness and personal use. It is not medical advice. By using the website, you agree to use it responsibly and understand that some features depend on accurate location and account information.
        </p>
      </div>
      </div>

    </section>
    </div>
  </div>
</template>

<style scoped>
/* ── Entrance animations ── */

@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-up {
  animation: slideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.about-root {
  min-height: 100vh;
  background: linear-gradient(to bottom, #ffeda0, #ffa585);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #ffffffcc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(6px);
}

.app-logo {
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: inherit;
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
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
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

.about-content {
  display: flex;
  justify-content: center;
  padding: 32px 16px 48px;
}

.about-card {
  max-width: 800px;
  width: 100%;
  background: rgba(255, 249, 240, 0.96);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  padding: 32px 36px 28px;
}

.about-title {
  font-size: 1.9rem;
  margin: 0 0 8px;
  color: #111827;
}

.about-intro {
  font-size: 0.98rem;
  color: #4b5563;
  margin: 0 0 20px;
  line-height: 1.5;
}

.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.1fr);
  column-gap: 32px;
  row-gap: 20px;
}

.about-sources {
  margin-top: 28px;
  padding: 20px 24px;
  background: rgba(255, 237, 160, 0.35);
  border-radius: 16px;
  border: 1px solid rgba(249, 115, 22, 0.15);
}

.about-sources h2 {
  font-size: 1.1rem;
  margin: 0 0 6px;
  color: #111827;
}

.sources-intro {
  font-size: 0.92rem;
  color: #6b7280;
  margin: 0 0 16px;
  line-height: 1.5;
}

.sources-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.source-icon {
  font-size: 1.4rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.source-item > div {
  flex: 1;
}

.source-item strong {
  display: block;
  font-size: 0.95rem;
  color: #111827;
  margin-bottom: 2px;
}

.source-item p {
  font-size: 0.88rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

.source-item a {
  color: #f97316;
  text-decoration: none;
  font-weight: 500;
}

.source-item a:hover {
  text-decoration: underline;
}

.about-legal {
  margin-top: 24px;
}

.about-legal .about-section {
  margin-bottom: 16px;
}

.about-legal .about-section:last-child {
  margin-bottom: 0;
}

.about-section h2 {
  font-size: 1.1rem;
  margin: 0 0 6px;
  color: #111827;
}

.about-section p {
  font-size: 0.95rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.55;
}

.about-section ul {
  padding-left: 18px;
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.55;
}

.about-section li {
  margin-bottom: 4px;
}


@media (max-width: 700px) {
  .about-card {
    padding: 22px 20px 20px;
  }

  .about-grid {
    grid-template-columns: 1fr;
  }
}
</style>

