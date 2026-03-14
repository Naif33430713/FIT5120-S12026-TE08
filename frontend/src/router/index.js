import { createRouter, createWebHistory } from "vue-router"
import Dashboard from "../views/Dashboard.vue"
import About from "../views/About.vue"

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard
  },
  {
    path: "/about",
    name: "About",
    component: About
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