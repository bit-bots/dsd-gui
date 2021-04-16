import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import ProjectView from '../views/ProjectView.vue'
import WelcomeView from '../views/WelcomeView.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'WelcomeView',
    component: WelcomeView
  },
  {
    path: '/projectView',
    name: 'ProjectView',
    component: ProjectView
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
