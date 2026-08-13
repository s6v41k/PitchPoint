<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  UserCircleIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { deleteMe, resendVerification } from '../api/auth'
import ConfirmModal from '../components/ConfirmModal.vue'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const name = auth.user?.name
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

// Pre-filled from the store; only name/email are editable here.
const profileForm = reactive({
  name: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
})
const profileError = ref('')
const profileSuccess = ref(false)
const savingProfile = ref(false)

// Kept separate from the name/email form: submitting it only sends a
// newPassword (plus the currentPassword check) when the user actually
// wants to change it, so saving your name never touches your password.
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})
const passwordError = ref('')
const passwordSuccess = ref(false)
const savingPassword = ref(false)

async function handleProfileSubmit() {
  profileError.value = ''
  profileSuccess.value = false
  savingProfile.value = true
  try {
    await auth.updateProfile({ name: profileForm.name, email: profileForm.email })
    profileSuccess.value = true
  } catch (err) {
    profileError.value = err.response?.data?.message || 'Could not update your profile.'
  } finally {
    savingProfile.value = false
  }
}

const resendingVerification = ref(false)
const resendMessage = ref('')

async function handleResendVerification() {
  resendMessage.value = ''
  resendingVerification.value = true
  try {
    const { message } = await resendVerification()
    resendMessage.value = message
  } catch (err) {
    resendMessage.value = err.response?.data?.message || 'Could not send verification email.'
  } finally {
    resendingVerification.value = false
  }
}

const showDeleteModal = ref(false)
const deleteError = ref('')
const deleting = ref(false)

async function handleDeleteAccount() {
  deleteError.value = ''
  deleting.value = true
  try {
    await deleteMe()
    auth.logout()
    router.push({ name: 'welcome' })
  } catch (err) {
    deleteError.value = err.response?.data?.message || 'Could not delete your account.'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

async function handlePasswordSubmit() {
  passwordError.value = ''
  passwordSuccess.value = false

  if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
    passwordError.value = 'New password and confirmation do not match.'
    return
  }

  savingPassword.value = true
  try {
    await auth.updateProfile({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordSuccess.value = true
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmNewPassword = ''
  } catch (err) {
    passwordError.value = err.response?.data?.message || 'Could not change your password.'
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-8">
    <div class="flex items-center gap-4">
      <span
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700"
      >
        {{ initials }}
      </span>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{{ auth.user?.name }}</h1>
        <p class="text-sm capitalize text-slate-500">{{ auth.user?.role }} account</p>
      </div>
    </div>

    <div
      v-if="auth.user && !auth.user.emailVerified"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      <p class="flex items-center gap-2">
        <EnvelopeIcon class="h-5 w-5 shrink-0" />
        Please verify your email address.
        <span v-if="resendMessage" class="font-medium">{{ resendMessage }}</span>
      </p>
      <button
        type="button"
        :disabled="resendingVerification"
        class="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        @click="handleResendVerification"
      >
        Resend email
      </button>
    </div>

    <form
      class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      @submit.prevent="handleProfileSubmit"
    >
      <h2 class="flex items-center gap-2 font-semibold text-slate-900">
        <UserCircleIcon class="h-5 w-5 text-indigo-600" />
        Account details
      </h2>

      <div>
        <label class="block text-sm font-medium text-slate-600">Name</label>
        <input
          v-model="profileForm.name"
          type="text"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Email</label>
        <input
          v-model="profileForm.email"
          type="email"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <p v-if="profileError" class="text-sm text-red-600">{{ profileError }}</p>
      <p v-if="profileSuccess" class="text-sm text-emerald-600">Profile updated.</p>

      <button
        type="submit"
        :disabled="savingProfile"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Save changes
      </button>
    </form>

    <form
      class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      @submit.prevent="handlePasswordSubmit"
    >
      <h2 class="flex items-center gap-2 font-semibold text-slate-900">
        <KeyIcon class="h-5 w-5 text-indigo-600" />
        Change password
      </h2>

      <div>
        <label class="block text-sm font-medium text-slate-600">Current password</label>
        <input
          v-model="passwordForm.currentPassword"
          type="password"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">New password</label>
        <input
          v-model="passwordForm.newPassword"
          type="password"
          minlength="6"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Confirm new password</label>
        <input
          v-model="passwordForm.confirmNewPassword"
          type="password"
          minlength="6"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
      <p v-if="passwordSuccess" class="text-sm text-emerald-600">Password changed.</p>

      <button
        type="submit"
        :disabled="savingPassword"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Change password
      </button>
    </form>

    <div class="space-y-4 rounded-xl border border-red-200 bg-red-50 p-5">
      <h2 class="flex items-center gap-2 font-semibold text-red-800">
        <ExclamationTriangleIcon class="h-5 w-5" />
        Danger zone
      </h2>
      <p class="text-sm text-red-700">
        Deleting your account permanently removes your bookings
        <span v-if="auth.isOwner">, your pitches, and every booking made on them</span>. This cannot
        be undone.
      </p>
      <p v-if="deleteError" class="text-sm text-red-700">{{ deleteError }}</p>
      <button
        type="button"
        class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="showDeleteModal = true"
      >
        Delete account
      </button>
    </div>

    <ConfirmModal
      :open="showDeleteModal"
      title="Delete account"
      message="Are you sure? This permanently deletes your account and cannot be undone."
      confirm-label="Delete my account"
      @confirm="handleDeleteAccount"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
