<script setup>
import { onMounted, ref } from 'vue'
import BookingList from '../components/BookingList.vue'
import { fetchMyBookings, cancelBooking } from '../api/bookings'

const bookings = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try {
    bookings.value = await fetchMyBookings()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load your bookings.'
  } finally {
    loading.value = false
  }
}

async function handleCancel(id) {
  try {
    const updated = await cancelBooking(id)
    // Patch the single booking in place instead of re-fetching the whole
    // list, so the UI updates instantly.
    const target = bookings.value.find((b) => b.id === id)
    if (target) target.status = updated.status
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not cancel this booking.'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">My bookings</h1>
    <p class="mt-1 text-slate-500">Everything you've booked, upcoming and past.</p>

    <p v-if="loading" class="mt-4 text-slate-500">Loading…</p>
    <p v-else-if="error" class="mt-4 text-red-600">{{ error }}</p>
    <div v-else class="mt-4">
      <BookingList :bookings="bookings" allow-cancel @cancel="handleCancel" />
    </div>
  </div>
</template>
