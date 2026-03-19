import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/Home.vue"
import Dashboard from "../views/Dashboard.vue"
import About from "../views/About.vue"
import Reminder from "../views/Reminder.vue"

const routes = [
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
  routes
})

export default router