<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    // If the user was redirected here from a protected page (e.g. trying
    // to book without being logged in), send them back there.
    router.push(route.query.redirect || { name: 'browse-pitches' })
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm py-8">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
      <h1 class="text-2xl font-bold text-slate-900">Welcome back</h1>
      <p class="mt-1 text-sm text-slate-500">Log in to book your next pitch.</p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-600">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-slate-600">Password</label>
            <RouterLink to="/forgot-password" class="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Forgot password?
            </RouterLink>
          </div>
          <input
            v-model="password"
            type="password"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Log in
        </button>
      </form>
    </div>

    <p class="mt-4 text-center text-sm text-slate-500">
      No account yet?
      <RouterLink to="/register" class="font-medium text-indigo-700 hover:text-indigo-800">Sign up</RouterLink>
    </p>
  </div>
</template>
