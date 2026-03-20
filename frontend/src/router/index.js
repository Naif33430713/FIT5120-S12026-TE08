import { createRouter, createWebHistory } from "vue-router"
import { isAppUnlocked } from "../utils/authGate"
import Home from "../views/Home.vue"
import Dashboard from "../views/Dashboard.vue"
import About from "../views/About.vue"
import Reminder from "../views/Reminder.vue"
import PasswordGate from "../views/PasswordGate.vue"

const routes = [
  {
    path: "/unlock",
    name: "Unlock",
    component: PasswordGate,
  },
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard
  },
  {
    path: "/about",
    name: "About",
    component: About
  },
  {
    path: "/reminder",
    name: "Reminder",
    component: Reminder
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/"
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0, left: 0 }
  }
})

router.beforeEach((to) => {
  if (isAppUnlocked()) {
    if (to.path === "/unlock") {
      return { path: "/", replace: true }
    }
    return true
  }
  if (to.path === "/unlock") {
    return true
  }
  return { path: "/unlock", query: { redirect: to.fullPath } }
})

export default router