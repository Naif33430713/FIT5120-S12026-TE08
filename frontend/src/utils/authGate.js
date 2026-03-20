/** Session-only unlock flag (clears when browser tab closes). */
export const AUTH_STORAGE_KEY = "sunshield_unlocked"

export function isAppUnlocked() {
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === "1"
}

export function setAppUnlocked() {
  sessionStorage.setItem(AUTH_STORAGE_KEY, "1")
}
