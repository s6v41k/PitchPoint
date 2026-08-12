import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())

// Restore the logged-in user (if a token is saved) *before* installing the
// router: vue-router triggers its initial navigation — and therefore the
// beforeEach guard — as a side effect of `app.use(router)`, not of
// `app.mount()`. GET /auth/me is a network round-trip, so if the router
// were installed first, the guard would run while the store still looked
// "authenticated but role-less" (token set, user still null) and wrongly
// bounce an owner away from /owner on every page refresh.
const authStore = useAuthStore()
await authStore.initFromStorage()

app.use(router)
app.mount('#app')
