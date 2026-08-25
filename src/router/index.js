import Course from '@/Pages/Course.vue'
import MainView from '@/Pages/MainView.vue'
import QuestionsView from '@/Pages/QuestionsView.vue'
import Results from '@/Pages/Results.vue'
import Review from '@/Pages/Review.vue'
import SecondPageView from '@/Pages/SecondPageView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: MainView },
    { path: '/secondpage', component: SecondPageView },
    { path: '/question', component: QuestionsView },
    { path: '/results', component: Results },
    { path: '/course', component: Course },
    { path: '/review', component: Review },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, left: 0 };
    }
  }
})

export default router
