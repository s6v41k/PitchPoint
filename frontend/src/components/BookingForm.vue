<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { fetchPitchBookings } from '../api/pitches'
import { createBooking } from '../api/bookings'

const props = defineProps({
  // The full pitch object (not just its id): the availability grid needs
  // pitch.openTime / pitch.closeTime, which are unique per pitch.
  pitch: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(['booked'])

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const pad = (n) => String(n).padStart(2, '0')
const toDateStr = (d) => d.toISOString().slice(0, 10)
const todayStr = toDateStr(new Date())
const currentHour = new Date().getHours()

const openHour = computed(() => Number(props.pitch.openTime.slice(0, 2)))
const closeHour = computed(() => Number(props.pitch.closeTime.slice(0, 2)))
const allHours = Array.from({ length: 24 }, (_, h) => h)

// A rolling 7-day window, not a calendar Mon-Sun week: simpler, and it
// always starts on a day that makes sense relative to `weekOffset` rather
// than needing special-casing for partial weeks at "today".
const weekOffset = ref(0)
const weekDays = computed(() => {
  const base = new Date()
  base.setDate(base.getDate() + weekOffset.value * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return toDateStr(d)
  })
})
const weekLabel = computed(() => {
  const first = new Date(weekDays.value[0])
  const last = new Date(weekDays.value[6])
  const fmt = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return `${fmt(first)} – ${fmt(last)}`
})

function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

// bookingsByDate: { '2026-08-11': [{startTime, endTime}, ...], ... }
const bookingsByDate = reactive({})
const loadingBookings = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref(false)

const selectedDate = ref(null)
const selectedStart = ref(null)
const selectedEnd = ref(null)

async function loadWeekBookings() {
  loadingBookings.value = true
  try {
    const results = await Promise.all(
      weekDays.value.map((d) => fetchPitchBookings(props.pitch.id, d))
    )
    weekDays.value.forEach((d, i) => {
      bookingsByDate[d] = results[i]
    })
  } catch {
    weekDays.value.forEach((d) => {
      bookingsByDate[d] = []
    })
  } finally {
    loadingBookings.value = false
  }
}

watch(
  weekOffset,
  () => {
    resetSelection()
    loadWeekBookings()
  },
  { immediate: true }
)

function hourStatus(dateStr, h) {
  if (h < openHour.value || h >= closeHour.value) return 'closed'
  if (dateStr < todayStr) return 'closed'
  if (dateStr === todayStr && h <= currentHour) return 'closed'

  const dayBookings = bookingsByDate[dateStr] || []
  const reserved = dayBookings.some((b) => {
    const bStart = Number(b.startTime.slice(0, 2))
    const bEnd = Number(b.endTime.slice(0, 2))
    return h >= bStart && h < bEnd
  })
  return reserved ? 'reserved' : 'free'
}

function isSelected(dateStr, h) {
  return (
    selectedDate.value === dateStr &&
    selectedStart.value !== null &&
    h >= selectedStart.value &&
    h < selectedEnd.value
  )
}

// Click-to-select, scoped per day: first click on a free cell starts the
// range; a second click on the same row extends it through that hour, but
// only if every hour in between is still free. Clicking a different day,
// clicking backwards, or clicking across a reserved/closed hour just
// restarts the selection at the clicked cell instead of erroring out.
function clickCell(dateStr, h) {
  if (hourStatus(dateStr, h) !== 'free') return

  if (selectedDate.value !== dateStr || selectedStart.value === null || h === selectedStart.value) {
    selectedDate.value = dateStr
    selectedStart.value = h
    selectedEnd.value = h + 1
    return
  }

  if (h < selectedStart.value) {
    selectedStart.value = h
    selectedEnd.value = h + 1
    return
  }

  const spansOnlyFreeHours = Array.from(
    { length: h - selectedStart.value + 1 },
    (_, i) => selectedStart.value + i
  ).every((x) => hourStatus(dateStr, x) === 'free')

  if (spansOnlyFreeHours) {
    selectedEnd.value = h + 1
  } else {
    selectedStart.value = h
    selectedEnd.value = h + 1
  }
}

const startTime = computed(() => (selectedStart.value !== null ? `${pad(selectedStart.value)}:00` : ''))
const endTime = computed(() => (selectedEnd.value !== null ? `${pad(selectedEnd.value)}:00` : ''))
const durationHours = computed(() => (selectedStart.value !== null ? selectedEnd.value - selectedStart.value : 0))

function resetSelection() {
  selectedDate.value = null
  selectedStart.value = null
  selectedEnd.value = null
}

async function handleSubmit() {
  error.value = ''
  success.value = false

  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (selectedDate.value === null) {
    error.value = 'Please select a time slot below.'
    return
  }

  submitting.value = true
  try {
    await createBooking({
      pitchId: props.pitch.id,
      date: selectedDate.value,
      startTime: startTime.value,
      endTime: endTime.value,
    })
    success.value = true
    resetSelection()
    await loadWeekBookings()
    emit('booked')
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not create the booking.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 font-semibold text-slate-900">
        <CalendarDaysIcon class="h-5 w-5 text-indigo-600" />
        Availability
      </h2>

      <div class="flex items-center gap-2 text-sm">
        <button
          type="button"
          class="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          @click="weekOffset--"
        >
          <ChevronLeftIcon class="h-4 w-4" />
        </button>
        <span class="min-w-[9rem] text-center font-medium text-slate-700">{{ weekLabel }}</span>
        <button
          type="button"
          class="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          @click="weekOffset++"
        >
          <ChevronRightIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div v-if="loadingBookings" class="mt-4 text-sm text-slate-400">Loading availability…</div>

    <div v-else class="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table class="w-full border-collapse text-center text-xs">
        <thead>
          <tr>
            <th class="sticky left-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-2 text-left font-medium text-slate-500">
              Day
            </th>
            <th v-for="h in allHours" :key="h" class="min-w-[2.25rem] bg-slate-50 py-2 font-medium text-slate-500">
              {{ pad(h) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in weekDays" :key="d" class="border-t border-slate-100">
            <td class="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1.5 text-left font-medium text-slate-700">
              {{ dayLabel(d) }}
            </td>
            <td v-for="h in allHours" :key="h" class="p-0.5">
              <button
                type="button"
                :disabled="hourStatus(d, h) !== 'free'"
                class="h-7 w-full rounded transition"
                :class="{
                  'bg-red-100 cursor-not-allowed': hourStatus(d, h) === 'closed',
                  'bg-violet-200 cursor-not-allowed': hourStatus(d, h) === 'reserved',
                  'bg-emerald-100 hover:bg-emerald-200 cursor-pointer': hourStatus(d, h) === 'free' && !isSelected(d, h),
                  'bg-indigo-600 cursor-pointer': isSelected(d, h),
                }"
                @click="clickCell(d, h)"
              ></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
      <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-emerald-100"></span> Free</span>
      <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-violet-200"></span> Reserved</span>
      <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-red-100"></span> Closed</span>
      <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-indigo-600"></span> Selected</span>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div class="text-sm">
        <p v-if="selectedDate !== null" class="text-slate-700">
          <span class="font-semibold">{{ dayLabel(selectedDate) }}, {{ startTime }}–{{ endTime }}</span>
          ({{ durationHours }} hour{{ durationHours > 1 ? 's' : '' }})
        </p>
        <p v-else class="text-slate-400">Select a time slot in the table above.</p>
        <p v-if="error" class="mt-1 text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-1 text-emerald-600">Booking confirmed!</p>
      </div>

      <button
        type="button"
        :disabled="submitting || selectedDate === null"
        class="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleSubmit"
      >
        {{ auth.isAuthenticated ? 'Book now' : 'Log in to book' }}
      </button>
    </div>
  </div>
</template>
