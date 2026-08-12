<script setup>
import { ref } from 'vue'
import { forgotPassword } from '../api/auth'

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await forgotPassword(email.value)
    // Always shows the same success state regardless of whether the email
    // is actually registered — the backend responds identically either
    // way (see backend authController.forgotPassword) so this page can't
    // be used to check which addresses have an account.
    submitted.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not send the reset email.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm py-8">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
      <h1 class="text-2xl font-bold text-slate-900">Forgot your password?</h1>
      <p class="mt-1 text-sm text-slate-500">
        Enter your email and we'll send you a link to reset it.
      </p>

      <div v-if="submitted" class="mt-6 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
        If that email is registered, a reset link is on its way. Check your inbox.
      </div>

      <form v-else class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-600">Email</label>
          <input
            v-model="email"
            type="email"
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
          Send reset link
        </button>
      </form>
    </div>

    <p class="mt-4 text-center text-sm text-slate-500">
      <RouterLink to="/login" class="font-medium text-indigo-700 hover:text-indigo-800">Back to log in</RouterLink>
    </p>
  </div>
</template>
