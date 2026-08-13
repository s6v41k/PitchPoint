<script setup>
import { CalendarDaysIcon, InboxIcon } from '@heroicons/vue/24/outline'

defineProps({
  bookings: {
    type: Array,
    required: true,
  },
  // Owner dashboard shows who made each booking; the player's own list
  // doesn't need to (it's obviously them).
  showUser: {
    type: Boolean,
    default: false,
  },
  // Only the player who made a booking is allowed to cancel it (enforced
  // again server-side) — the owner dashboard passes false here.
  allowCancel: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['cancel'])

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div
    v-if="bookings.length === 0"
    class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-10 text-center"
  >
    <InboxIcon class="h-9 w-9 text-slate-300" />
    <p class="text-slate-500">No bookings yet.</p>
  </div>

  <ul v-else class="space-y-3">
    <li
      v-for="booking in bookings"
      :key="booking.id"
      class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"
        >
          <CalendarDaysIcon class="h-5 w-5" />
        </span>
        <div>
          <p class="font-medium text-slate-900">{{ booking.pitch?.name }}</p>
          <p class="text-sm text-slate-500">{{ booking.pitch?.address }}</p>
          <p class="mt-1 text-sm text-slate-600">
            {{ formatDate(booking.date) }} · {{ booking.startTime.slice(0, 5) }}–{{
              booking.endTime.slice(0, 5)
            }}
          </p>
          <p v-if="showUser && booking.user" class="text-sm text-slate-500">
            Booked by {{ booking.user.name }} ({{ booking.user.email }})
          </p>
        </div>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-2">
        <span
          class="rounded-full px-2.5 py-1 text-xs font-medium"
          :class="
            booking.status === 'confirmed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          "
        >
          {{ booking.status }}
        </span>

        <button
          v-if="allowCancel && booking.status === 'confirmed'"
          type="button"
          class="text-sm font-medium text-red-600 hover:text-red-700"
          @click="$emit('cancel', booking.id)"
        >
          Cancel
        </button>
      </div>
    </li>
  </ul>
</template>
