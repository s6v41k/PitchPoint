<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref('player')
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value,
    })
    router.push({ name: 'browse-pitches' })
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm py-8">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
      <h1 class="text-2xl font-bold text-slate-900">Create an account</h1>
      <p class="mt-1 text-sm text-slate-500">Join PitchPoint in under a minute.</p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-600">Name</label>
          <input
            v-model="name"
            type="text"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
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
          <label class="block text-sm font-medium text-slate-600">Password</label>
          <input
            v-model="password"
            type="password"
            minlength="6"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <fieldset>
          <legend class="block text-sm font-medium text-slate-600">I am a…</legend>
          <div class="mt-1.5 grid grid-cols-2 gap-2 text-sm">
            <label
              class="cursor-pointer rounded-md border px-3 py-2 text-center transition"
              :class="
                role === 'player'
                  ? 'border-indigo-500 bg-indigo-50 font-medium text-indigo-700'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
              "
            >
              <input v-model="role" type="radio" value="player" class="sr-only" />
              Player
            </label>
            <label
              class="cursor-pointer rounded-md border px-3 py-2 text-center transition"
              :class="
                role === 'owner'
                  ? 'border-indigo-500 bg-indigo-50 font-medium text-indigo-700'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
              "
            >
              <input v-model="role" type="radio" value="owner" class="sr-only" />
              Owner
            </label>
          </div>
        </fieldset>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Sign up
        </button>
      </form>
    </div>

    <p class="mt-4 text-center text-sm text-slate-500">
      Already have an account?
      <RouterLink to="/login" class="font-medium text-indigo-700 hover:text-indigo-800"
        >Log in</RouterLink
      >
    </p>
  </div>
</template>
