<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { verifyEmail } from '../api/auth'

const route = useRoute()
const loading = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    error.value = 'This verification link is missing its token.'
    loading.value = false
    return
  }
  try {
    await verifyEmail(token)
    success.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not verify your email.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-sm py-8">
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-900/5"
    >
      <h1 class="text-2xl font-bold text-slate-900">Email verification</h1>

      <p v-if="loading" class="mt-4 text-slate-500">Verifying…</p>
      <p v-else-if="success" class="mt-4 text-emerald-600">
        Your email is verified. You're all set!
      </p>
      <p v-else class="mt-4 text-red-600">{{ error }}</p>

      <RouterLink
        :to="{ name: 'browse-pitches' }"
        class="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Continue to PitchPoint
      </RouterLink>
    </div>
  </div>
</template>
