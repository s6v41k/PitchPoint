import { defineStore } from 'pinia'
import * as authApi from '../api/auth'

const TOKEN_KEY = 'pitchpoint_token'

// Holds the logged-in user's identity for the whole app. Components read
// `isAuthenticated` / `isOwner` to decide what to show, and the router
// guards (see router/index.js) read them to decide where navigation is
// allowed to go.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isOwner: (state) => state.user?.role === 'owner',
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    // The JWT is the only thing that needs to survive a page reload —
    // everything else (the `user` object) is re-fetched from /auth/me so
    // it can never go stale in localStorage.
    async initFromStorage() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return

      this.token = token
      try {
        const { user } = await authApi.fetchMe()
        this.user = user
      } catch {
        // Token expired or invalid — clear it rather than staying in a
        // half-logged-in state.
        this.logout()
      }
    },

    async login(credentials) {
      const { token, user } = await authApi.login(credentials)
      this.setSession(token, user)
    },

    async register(payload) {
      const { token, user } = await authApi.register(payload)
      this.setSession(token, user)
    },

    async updateProfile(payload) {
      const { user } = await authApi.updateMe(payload)
      // Token doesn't change — only the profile fields do — so just patch
      // the cached user instead of re-running the whole login flow.
      this.user = user
    },

    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem(TOKEN_KEY, token)
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
    },
  },
})
