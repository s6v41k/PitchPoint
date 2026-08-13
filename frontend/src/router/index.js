import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'welcome',
    component: () => import('../views/WelcomeView.vue'),
  },
  {
    path: '/browse',
    name: 'browse-pitches',
    component: () => import('../views/BrowsePitches.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pitches/:id',
    name: 'pitch-detail',
    component: () => import('../views/PitchDetail.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPasswordView.vue'),
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordView.vue'),
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('../views/VerifyEmailView.vue'),
  },
  {
    path: '/my-bookings',
    name: 'my-bookings',
    component: () => import('../views/MyBookings.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/owner',
    name: 'owner-dashboard',
    component: () => import('../views/OwnerDashboard.vue'),
    meta: { requiresAuth: true, requiresOwner: true },
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// A single navigation guard covers every protected route via `meta`,
// instead of repeating an auth check inside each view's own logic.
router.beforeEach((to) => {
  const auth = useAuthStore()

  // The landing page is only useful as a logged-out pitch — send returning
  // users straight into the app instead of showing it again on every visit
  // to "/" (e.g. clicking the logo).
  if (to.name === 'welcome' && auth.isAuthenticated) {
    return { name: 'browse-pitches' }
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresOwner && !auth.isOwner) {
    return { name: 'browse-pitches' }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'browse-pitches' }
  }
  return true
})

export default router
