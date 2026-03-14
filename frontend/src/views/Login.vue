<script setup>
function loginWithGoogle() {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`
}
</script>

<template>
  <div class="login-container">
    <h1>☀ UV Protection App</h1>
    <p>Stay protected from harmful UV exposure</p>

    <button @click="loginWithGoogle" class="google-btn">
      Sign in with Google
    </button>
  </div>
</template>

<style>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-family: Arial;
}

.google-btn {
  margin-top: 20px;
  padding: 12px 20px;
  font-size: 16px;
  background: #4285F4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.google-btn:hover {
  background: #3367D6;
}
</style>