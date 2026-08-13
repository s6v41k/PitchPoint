<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import {
  fetchPitchBookings,
  fetchClosures,
  fetchMyWaitlistEntries,
  joinWaitlist as joinWaitlistApi,
  leaveWaitlist as leaveWaitlistApi,
} from '../api/pitches'
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
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// bookingsByDate: { '2026-08-11': [{startTime, endTime}, ...], ... }
const bookingsByDate = reactive({})
const closuresByDate = reactive({})
const myWaitlistEntries = ref([])
const loadingBookings = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref(false)
const waitlistSubmitting = ref(false)
const waitlistError = ref('')
const waitlistSuccess = ref('')

const selectedDate = ref(null)
const selectedStart = ref(null)
const selectedEnd = ref(null)
// 'book' for a free slot, 'waitlist' for a slot someone else already has.
const selectedMode = ref('book')

async function loadWeekBookings() {
  loadingBookings.value = true
  try {
    const [bookingResults, closureResults] = await Promise.all([
      Promise.all(weekDays.value.map((d) => fetchPitchBookings(props.pitch.id, d))),
      Promise.all(weekDays.value.map((d) => fetchClosures(props.pitch.id, d))),
    ])
    weekDays.value.forEach((d, i) => {
      bookingsByDate[d] = bookingResults[i]
      closuresByDate[d] = closureResults[i]
    })
  } catch {
    weekDays.value.forEach((d) => {
      bookingsByDate[d] = []
      closuresByDate[d] = []
    })
  } finally {
    loadingBookings.value = false
  }
}

async function loadMyWaitlist() {
  if (!auth.isAuthenticated) return
  try {
    myWaitlistEntries.value = await fetchMyWaitlistEntries(props.pitch.id)
  } catch {
    myWaitlistEntries.value = []
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
onMounted(loadMyWaitlist)

function hourStatus(dateStr, h) {
  if (h < openHour.value || h >= closeHour.value) return 'closed'
  if (dateStr < todayStr) return 'closed'
  if (dateStr === todayStr && h <= currentHour) return 'closed'

  const dayClosures = closuresByDate[dateStr] || []
  const closedByOwner = dayClosures.some((c) => {
    const cStart = Number(c.startTime.slice(0, 2))
    const cEnd = Number(c.endTime.slice(0, 2))
    return h >= cStart && h < cEnd
  })
  if (closedByOwner) return 'closed'

  const dayBookings = bookingsByDate[dateStr] || []
  const reserved = dayBookings.some((b) => {
    const bStart = Number(b.startTime.slice(0, 2))
    const bEnd = Number(b.endTime.slice(0, 2))
    return h >= bStart && h < bEnd
  })
  return reserved ? 'reserved' : 'free'
}

// The specific booking covering a reserved hour — its own [start, end)
// might span more than the one clicked hour, and joining the waiting list
// should target that whole real reservation, not just the single cell.
function findCoveringBooking(dateStr, h) {
  return (bookingsByDate[dateStr] || []).find((b) => {
    const bStart = Number(b.startTime.slice(0, 2))
    const bEnd = Number(b.endTime.slice(0, 2))
    return h >= bStart && h < bEnd
  })
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
// Clicking a *reserved* cell instead selects that whole existing
// reservation so the footer can offer to join its waiting list.
function clickCell(dateStr, h) {
  const status = hourStatus(dateStr, h)
  if (status === 'closed') return

  if (status === 'reserved') {
    const covering = findCoveringBooking(dateStr, h)
    if (!covering) return
    selectedDate.value = dateStr
    selectedStart.value = Number(covering.startTime.slice(0, 2))
    selectedEnd.value = Number(covering.endTime.slice(0, 2))
    selectedMode.value = 'waitlist'
    waitlistError.value = ''
    waitlistSuccess.value = ''
    return
  }

  selectedMode.value = 'book'
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

const startTime = computed(() =>
  selectedStart.value !== null ? `${pad(selectedStart.value)}:00` : ''
)
const endTime = computed(() => (selectedEnd.value !== null ? `${pad(selectedEnd.value)}:00` : ''))
const durationHours = computed(() =>
  selectedStart.value !== null ? selectedEnd.value - selectedStart.value : 0
)

// The current user's own waitlist entry for whatever's selected right
// now, if any — lets the footer offer "leave" instead of "join".
const myWaitlistEntry = computed(() => {
  if (selectedMode.value !== 'waitlist' || selectedDate.value === null) return null
  return (
    myWaitlistEntries.value.find(
      (e) =>
        e.date === selectedDate.value &&
        Number(e.startTime.slice(0, 2)) === selectedStart.value &&
        Number(e.endTime.slice(0, 2)) === selectedEnd.value
    ) || null
  )
})

function resetSelection() {
  selectedDate.value = null
  selectedStart.value = null
  selectedEnd.value = null
  selectedMode.value = 'book'
  waitlistError.value = ''
  waitlistSuccess.value = ''
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

async function handleJoinWaitlist() {
  waitlistError.value = ''
  waitlistSuccess.value = ''

  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  waitlistSubmitting.value = true
  try {
    const entry = await joinWaitlistApi(props.pitch.id, {
      date: selectedDate.value,
      startTime: startTime.value,
      endTime: endTime.value,
    })
    myWaitlistEntries.value.push(entry)
    waitlistSuccess.value = "You're on the waiting list — we'll email you if this slot frees up."
  } catch (err) {
    waitlistError.value = err.response?.data?.message || 'Could not join the waiting list.'
  } finally {
    waitlistSubmitting.value = false
  }
}

async function handleLeaveWaitlist() {
  if (!myWaitlistEntry.value) return
  waitlistError.value = ''
  waitlistSubmitting.value = true
  try {
    await leaveWaitlistApi(props.pitch.id, myWaitlistEntry.value.id)
    myWaitlistEntries.value = myWaitlistEntries.value.filter(
      (e) => e.id !== myWaitlistEntry.value.id
    )
    waitlistSuccess.value = ''
  } catch (err) {
    waitlistError.value = err.response?.data?.message || 'Could not leave the waiting list.'
  } finally {
    waitlistSubmitting.value = false
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
            <th
              class="sticky left-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-2 text-left font-medium text-slate-500"
            >
              Day
            </th>
            <th
              v-for="h in allHours"
              :key="h"
              class="min-w-[2.25rem] bg-slate-50 py-2 font-medium text-slate-500"
            >
              {{ pad(h) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in weekDays" :key="d" class="border-t border-slate-100">
            <td
              class="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1.5 text-left font-medium text-slate-700"
            >
              {{ dayLabel(d) }}
            </td>
            <td v-for="h in allHours" :key="h" class="p-0.5">
              <button
                type="button"
                :disabled="hourStatus(d, h) === 'closed'"
                class="h-7 w-full rounded transition"
                :class="{
                  'bg-red-100 cursor-not-allowed': hourStatus(d, h) === 'closed',
                  'bg-violet-200 hover:bg-violet-300 cursor-pointer':
                    hourStatus(d, h) === 'reserved' && !isSelected(d, h),
                  'bg-emerald-100 hover:bg-emerald-200 cursor-pointer':
                    hourStatus(d, h) === 'free' && !isSelected(d, h),
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
      <span class="flex items-center gap-1.5"
        ><span class="h-3 w-3 rounded bg-emerald-100"></span> Free</span
      >
      <span class="flex items-center gap-1.5"
        ><span class="h-3 w-3 rounded bg-violet-200"></span> Reserved</span
      >
      <span class="flex items-center gap-1.5"
        ><span class="h-3 w-3 rounded bg-red-100"></span> Closed</span
      >
      <span class="flex items-center gap-1.5"
        ><span class="h-3 w-3 rounded bg-indigo-600"></span> Selected</span
      >
    </div>
    <p class="mt-1 text-xs text-slate-400">Tip: click a reserved slot to join its waiting list.</p>

    <div
      class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
    >
      <div class="text-sm">
        <p v-if="selectedDate !== null" class="text-slate-700">
          <span class="font-semibold"
            >{{ dayLabel(selectedDate) }}, {{ startTime }}–{{ endTime }}</span
          >
          <template v-if="selectedMode === 'book'">
            ({{ durationHours }} hour{{ durationHours > 1 ? 's' : '' }})
          </template>
          <span v-else class="ml-1 text-violet-600">— already taken</span>
        </p>
        <p v-else class="text-slate-400">Select a time slot in the table above.</p>
        <template v-if="selectedMode === 'book'">
          <p v-if="error" class="mt-1 text-red-600">{{ error }}</p>
          <p v-if="success" class="mt-1 text-emerald-600">Booking confirmed!</p>
        </template>
        <template v-else>
          <p v-if="waitlistError" class="mt-1 text-red-600">{{ waitlistError }}</p>
          <p v-if="waitlistSuccess" class="mt-1 text-emerald-600">{{ waitlistSuccess }}</p>
        </template>
      </div>

      <button
        v-if="selectedMode === 'book'"
        type="button"
        :disabled="submitting || selectedDate === null"
        class="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleSubmit"
      >
        {{ auth.isAuthenticated ? 'Book now' : 'Log in to book' }}
      </button>
      <button
        v-else-if="myWaitlistEntry"
        type="button"
        :disabled="waitlistSubmitting"
        class="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleLeaveWaitlist"
      >
        Leave waiting list
      </button>
      <button
        v-else
        type="button"
        :disabled="waitlistSubmitting"
        class="rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleJoinWaitlist"
      >
        {{ auth.isAuthenticated ? 'Join waiting list' : 'Log in to join' }}
      </button>
    </div>
  </div>
</template>
