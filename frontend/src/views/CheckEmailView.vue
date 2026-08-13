<script setup>
import { useRoute } from 'vue-router'
import { EnvelopeIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const email = route.query.email || ''
</script>

<template>
  <div class="mx-auto max-w-sm py-8">
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-900/5"
    >
      <span
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"
      >
        <EnvelopeIcon class="h-6 w-6" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-slate-900">Check your email</h1>
      <p class="mt-2 text-sm text-slate-500">
        We've sent a verification link<span v-if="email">
          to <span class="font-medium text-slate-700">{{ email }}</span></span
        >. Click the link to verify your account, then log in below.
      </p>

      <RouterLink
        :to="{ name: 'login' }"
        class="mt-6 inline-block w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Go to login
      </RouterLink>

      <p class="mt-4 text-xs text-slate-400">
        Didn't get it? Log in anyway — you can resend the link from your profile page.
      </p>
    </div>
  </div>
</template>
