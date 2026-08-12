<script setup>
import { computed, onMounted, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import 'chart.js/auto'
import { BuildingOffice2Icon, CalendarDaysIcon } from '@heroicons/vue/24/outline'
import BookingList from '../components/BookingList.vue'
import PitchForm from '../components/PitchForm.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import {
  fetchMyPitches,
  createPitch,
  updatePitch,
  deletePitch,
} from '../api/pitches'
import { fetchOwnerBookings } from '../api/bookings'

const pitches = ref([])
const bookings = ref([])
const loading = ref(true)
const error = ref('')

// null = form hidden, {} = creating, {...pitch} = editing that pitch.
const editingPitch = ref(null)
const showForm = ref(false)
const pitchPendingDelete = ref(null)

const confirmedBookingCount = computed(
  () => bookings.value.filter((b) => b.status === 'confirmed').length
)

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    ;[pitches.value, bookings.value] = await Promise.all([
      fetchMyPitches(),
      fetchOwnerBookings(),
    ])
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load dashboard data.'
  } finally {
    loading.value = false
  }
}

function startCreate() {
  editingPitch.value = null
  showForm.value = true
}

function startEdit(pitch) {
  editingPitch.value = pitch
  showForm.value = true
}

async function handleFormSubmit(payload) {
  try {
    if (editingPitch.value) {
      await updatePitch(editingPitch.value.id, payload)
    } else {
      await createPitch(payload)
    }
    showForm.value = false
    editingPitch.value = null
    await loadAll()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not save this pitch.'
  }
}

async function confirmDelete() {
  const pitch = pitchPendingDelete.value
  pitchPendingDelete.value = null
  if (!pitch) return
  try {
    await deletePitch(pitch.id)
    await loadAll()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not delete this pitch.'
  }
}

// --- Charts: two single-measure bar charts (never dual-axis) built from
// the same `bookings` list already loaded above — bookings per pitch
// (which pitch gets used most) and estimated revenue per week (how
// booking value is trending). Each stays a single series, so per the
// dataviz convention it's colored with one flat hue and skips a legend
// (the chart title already names the series). ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
}

const bookingsByPitchChart = computed(() => {
  const counts = new Map()
  bookings.value
    .filter((b) => b.status === 'confirmed')
    .forEach((b) => {
      const name = b.pitch?.name || 'Unknown'
      counts.set(name, (counts.get(name) || 0) + 1)
    })
  return {
    labels: [...counts.keys()],
    datasets: [
      {
        label: 'Confirmed bookings',
        data: [...counts.values()],
        backgroundColor: '#4f46e5',
        borderRadius: 4,
      },
    ],
  }
})

function hoursBetween(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

function weekStart(dateStr) {
  const d = new Date(dateStr)
  const dayIndex = (d.getDay() + 6) % 7 // Monday = 0 ... Sunday = 6
  d.setDate(d.getDate() - dayIndex)
  return d
}

const revenueByWeekChart = computed(() => {
  const totals = new Map() // key: week-start ISO date -> { label, total }
  bookings.value
    .filter((b) => b.status === 'confirmed')
    .forEach((b) => {
      const start = weekStart(b.date)
      const key = start.toISOString().slice(0, 10)
      const revenue = hoursBetween(b.startTime, b.endTime) * Number(b.pitch?.pricePerHour || 0)
      const entry = totals.get(key) || {
        label: start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        total: 0,
      }
      entry.total += revenue
      totals.set(key, entry)
    })
  const sortedKeys = [...totals.keys()].sort()
  return {
    labels: sortedKeys.map((k) => totals.get(k).label),
    datasets: [
      {
        label: 'Estimated revenue (€)',
        data: sortedKeys.map((k) => totals.get(k).total),
        backgroundColor: '#f59e0b',
        borderRadius: 4,
      },
    ],
  }
})

onMounted(loadAll)
</script>

<template>
  <div class="space-y-10">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Owner dashboard</h1>
      <p class="mt-1 text-slate-500">Manage your pitches and see who's booked them.</p>

      <div class="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-2xl font-bold text-indigo-700">{{ pitches.length }}</p>
          <p class="text-sm text-slate-500">Pitches listed</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-2xl font-bold text-indigo-700">{{ confirmedBookingCount }}</p>
          <p class="text-sm text-slate-500">Active bookings</p>
        </div>
      </div>
    </div>

    <section v-if="!loading" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="font-semibold text-slate-900">Bookings by pitch</h2>
        <div v-if="confirmedBookingCount > 0" class="mt-3 h-56">
          <Bar :data="bookingsByPitchChart" :options="chartOptions" />
        </div>
        <p v-else class="mt-3 py-16 text-center text-sm text-slate-400">
          Charts appear here once your pitches have confirmed bookings.
        </p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="font-semibold text-slate-900">Estimated revenue by week</h2>
        <div v-if="confirmedBookingCount > 0" class="mt-3 h-56">
          <Bar :data="revenueByWeekChart" :options="chartOptions" />
        </div>
        <p v-else class="mt-3 py-16 text-center text-sm text-slate-400">
          Charts appear here once your pitches have confirmed bookings.
        </p>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-900">My pitches</h2>
        <button
          v-if="!showForm"
          type="button"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          @click="startCreate"
        >
          Add pitch
        </button>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>

      <PitchForm
        v-if="showForm"
        class="mt-4"
        :initial="editingPitch"
        @submit="handleFormSubmit"
        @cancel="showForm = false"
      />

      <p v-if="loading" class="mt-4 text-slate-500">Loading…</p>
      <div v-else-if="pitches.length === 0" class="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-10 text-center">
        <BuildingOffice2Icon class="h-9 w-9 text-slate-300" />
        <p class="text-slate-500">You haven't added any pitches yet.</p>
      </div>

      <ul v-else class="mt-4 space-y-3">
        <li
          v-for="pitch in pitches"
          :key="pitch.id"
          class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BuildingOffice2Icon class="h-5 w-5" />
            </span>
            <div>
              <p class="font-medium text-slate-900">{{ pitch.name }}</p>
              <p class="text-sm text-slate-500">{{ pitch.address }}</p>
              <p class="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <span class="font-medium text-amber-600">€{{ Number(pitch.pricePerHour).toFixed(2) }}/h</span>
                <span>·</span>
                <CalendarDaysIcon class="h-3.5 w-3.5" />
                {{ pitch.bookings?.length || 0 }} booking(s)
              </p>
            </div>
          </div>
          <div class="flex shrink-0 gap-3 text-sm font-medium">
            <button type="button" class="text-indigo-700 hover:text-indigo-800" @click="startEdit(pitch)">
              Edit
            </button>
            <button type="button" class="text-red-600 hover:text-red-700" @click="pitchPendingDelete = pitch">
              Delete
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-xl font-bold text-slate-900">Bookings for my pitches</h2>
      <div class="mt-4">
        <BookingList :bookings="bookings" show-user />
      </div>
    </section>

    <ConfirmModal
      :open="pitchPendingDelete !== null"
      title="Delete pitch"
      :message="`Delete “${pitchPendingDelete?.name}”? This cannot be undone.`"
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="pitchPendingDelete = null"
    />
  </div>
</template>
