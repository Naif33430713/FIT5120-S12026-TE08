<script setup>
import { RouterLink } from "vue-router"
</script>

<template>
  <div class="about-root">
    <section class="about-card">
      <h1 class="about-title">About SunShield</h1>
      <p class="about-intro">
        SunShield is a UV awareness and prevention app designed for young Australians
        in Victoria who are navigating new tanning trends and social media influences.
        It turns invisible UV radiation into clear, relatable guidance so you and your
        friends can stay sun safe without giving up your lifestyle.
      </p>

      <div class="about-grid">
        <div class="about-section">
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

        <div class="about-section">
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

      <div class="about-legal">
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

      <div class="about-actions">
        <RouterLink to="/" class="about-back">
          ← Back to dashboard
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-root {
  min-height: 100vh;
  background: linear-gradient(to bottom, #ffeda0, #ffa585);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

.about-actions {
  margin-top: 18px;
}

.about-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #f97316;
  background: #f97316;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.25);
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;
}

.about-back:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(249, 115, 22, 0.3);
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

