<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPassword } from '../api/auth'

const route = useRoute()
const router = useRouter()

const token = route.query.token || ''
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const success = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''

  if (!token) {
    error.value = 'This reset link is missing its token. Request a new one.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New password and confirmation do not match.'
    return
  }

  submitting.value = true
  try {
    await resetPassword(token, newPassword.value)
    success.value = true
    setTimeout(() => router.push({ name: 'login' }), 2000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not reset your password.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm py-8">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
      <h1 class="text-2xl font-bold text-slate-900">Reset your password</h1>

      <div v-if="success" class="mt-6 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
        Password reset! Redirecting you to log in…
      </div>

      <form v-else class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-600">New password</label>
          <input
            v-model="newPassword"
            type="password"
            minlength="6"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-600">Confirm new password</label>
          <input
            v-model="confirmPassword"
            type="password"
            minlength="6"
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
          Reset password
        </button>
      </form>
    </div>
  </div>
</template>
