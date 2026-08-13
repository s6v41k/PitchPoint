<script setup>
import { onMounted, ref, watch } from 'vue'
import { MagnifyingGlassIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { fetchUsers, updateUserRole, deleteUser } from '../api/admin'
import ConfirmModal from '../components/ConfirmModal.vue'

const auth = useAuthStore()
const { showToast } = useToast()

const users = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const savingId = ref(null)
const userPendingDelete = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    users.value = await fetchUsers(search.value)
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load users.'
  } finally {
    loading.value = false
  }
}

// Debounced so typing a search term doesn't fire a request per keystroke.
let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
})

async function handleRoleChange(user, role) {
  const previousRole = user.role
  user.role = role
  savingId.value = user.id
  try {
    const updated = await updateUserRole(user.id, role)
    user.role = updated.role
    showToast(`${user.name} is now ${role}.`)
  } catch (err) {
    user.role = previousRole
    error.value = err.response?.data?.message || 'Could not change the role for this user.'
  } finally {
    savingId.value = null
  }
}

async function confirmDelete() {
  const user = userPendingDelete.value
  userPendingDelete.value = null
  if (!user) return
  try {
    await deleteUser(user.id)
    users.value = users.value.filter((u) => u.id !== user.id)
    showToast(`Deleted ${user.name}'s account.`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not delete this user.'
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center gap-2">
      <ShieldCheckIcon class="h-7 w-7 text-indigo-600" />
      <h1 class="text-2xl font-bold text-slate-900">Admin dashboard</h1>
    </div>
    <p class="mt-1 text-slate-500">Manage every account on the platform.</p>

    <div class="mt-4 max-w-sm">
      <div class="relative">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email"
          class="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="loading" class="mt-6 text-slate-500">Loading…</p>

    <div
      v-else-if="users.length === 0"
      class="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-10 text-center"
    >
      <UsersIcon class="h-9 w-9 text-slate-300" />
      <p class="text-slate-500">No users match your search.</p>
    </div>

    <div v-else class="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead
          class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Role</th>
            <th class="px-4 py-3">Verified</th>
            <th class="px-4 py-3">Joined</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="user in users" :key="user.id">
            <td class="px-4 py-3 font-medium text-slate-900">
              {{ user.name }}
              <span v-if="user.id === auth.user?.id" class="ml-1 text-xs font-normal text-slate-400"
                >(you)</span
              >
            </td>
            <td class="px-4 py-3 text-slate-600">{{ user.email }}</td>
            <td class="px-4 py-3">
              <select
                :value="user.role"
                :disabled="user.id === auth.user?.id || savingId === user.id"
                class="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm capitalize focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                @change="handleRoleChange(user, $event.target.value)"
              >
                <option value="player">Player</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="
                  user.emailVerified
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                "
              >
                {{ user.emailVerified ? 'Verified' : 'Unverified' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ formatDate(user.createdAt) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                v-if="user.id !== auth.user?.id"
                type="button"
                class="font-medium text-red-600 hover:text-red-700"
                @click="userPendingDelete = user"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmModal
      :open="userPendingDelete !== null"
      title="Delete account"
      :message="`Delete ${userPendingDelete?.name}'s account? This removes their bookings${userPendingDelete?.role === 'owner' ? ', their pitches, and every booking made on them' : ''}. This cannot be undone.`"
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="userPendingDelete = null"
    />
  </div>
</template>
