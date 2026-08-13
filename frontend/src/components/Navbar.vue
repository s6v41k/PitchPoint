<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const mobileOpen = ref(false)

function handleLogout() {
  mobileOpen.value = false
  auth.logout()
  router.push({ name: 'welcome' })
}
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <RouterLink
        :to="auth.isAuthenticated ? { name: 'browse-pitches' } : { name: 'welcome' }"
        class="flex items-center gap-2 text-xl font-bold text-indigo-700"
        @click="mobileOpen = false"
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-amber-400"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path
              d="M12 2 L14.5 9 L21 9.5 L15.8 14 L17.5 21 L12 17 L6.5 21 L8.2 14 L3 9.5 L9.5 9 Z"
              fill="currentColor"
            />
          </svg>
        </span>
        PitchPoint
      </RouterLink>

      <!-- Below `sm`, the link list is wide enough to overflow the
      viewport (up to 6 items once owner/admin links show), so it's
      swapped for a hamburger + stacked panel instead of trying to shrink
      everything to fit one row. -->
      <div class="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex">
        <template v-if="auth.isAuthenticated">
          <RouterLink :to="{ name: 'browse-pitches' }" class="hover:text-indigo-700">
            Browse pitches
          </RouterLink>
          <RouterLink to="/my-bookings" class="hover:text-indigo-700"> My bookings </RouterLink>
          <RouterLink v-if="auth.isOwner" to="/owner" class="hover:text-indigo-700">
            Owner dashboard
          </RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="hover:text-indigo-700">
            Admin
          </RouterLink>
          <RouterLink to="/profile" class="hover:text-indigo-700">
            {{ auth.user?.name }}
          </RouterLink>
          <button
            type="button"
            class="rounded-md bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
            @click="handleLogout"
          >
            Log out
          </button>
        </template>

        <template v-else>
          <RouterLink to="/login" class="hover:text-indigo-700">Log in</RouterLink>
          <RouterLink
            to="/register"
            class="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
          >
            Sign up
          </RouterLink>
        </template>
      </div>

      <button
        type="button"
        class="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
        :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
        @click="mobileOpen = !mobileOpen"
      >
        <XMarkIcon v-if="mobileOpen" class="h-6 w-6" />
        <Bars3Icon v-else class="h-6 w-6" />
      </button>
    </nav>

    <div v-if="mobileOpen" class="border-t border-slate-200 px-4 py-3 sm:hidden">
      <div class="flex flex-col gap-1 text-sm font-medium text-slate-600">
        <template v-if="auth.isAuthenticated">
          <RouterLink
            :to="{ name: 'browse-pitches' }"
            class="rounded-md px-2 py-2 hover:bg-slate-50 hover:text-indigo-700"
            @click="mobileOpen = false"
          >
            Browse pitches
          </RouterLink>
          <RouterLink
            to="/my-bookings"
            class="rounded-md px-2 py-2 hover:bg-slate-50 hover:text-indigo-700"
            @click="mobileOpen = false"
          >
            My bookings
          </RouterLink>
          <RouterLink
            v-if="auth.isOwner"
            to="/owner"
            class="rounded-md px-2 py-2 hover:bg-slate-50 hover:text-indigo-700"
            @click="mobileOpen = false"
          >
            Owner dashboard
          </RouterLink>
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="rounded-md px-2 py-2 hover:bg-slate-50 hover:text-indigo-700"
            @click="mobileOpen = false"
          >
            Admin
          </RouterLink>
          <RouterLink
            to="/profile"
            class="rounded-md px-2 py-2 hover:bg-slate-50 hover:text-indigo-700"
            @click="mobileOpen = false"
          >
            {{ auth.user?.name }}
          </RouterLink>
          <button
            type="button"
            class="mt-1 rounded-md bg-slate-100 px-2 py-2 text-left hover:bg-slate-200"
            @click="handleLogout"
          >
            Log out
          </button>
        </template>

        <template v-else>
          <RouterLink
            to="/login"
            class="rounded-md px-2 py-2 hover:bg-slate-50 hover:text-indigo-700"
            @click="mobileOpen = false"
          >
            Log in
          </RouterLink>
          <RouterLink
            to="/register"
            class="mt-1 rounded-md bg-indigo-600 px-2 py-2 text-center text-white hover:bg-indigo-700"
            @click="mobileOpen = false"
          >
            Sign up
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>
