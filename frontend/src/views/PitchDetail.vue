<script setup>
import { computed, onMounted, ref } from 'vue'
import { MapPinIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import BookingForm from '../components/BookingForm.vue'
import PitchReviews from '../components/PitchReviews.vue'
import StarRating from '../components/StarRating.vue'
import { fetchPitch } from '../api/pitches'
import { useToast } from '../composables/useToast'

const props = defineProps({
  id: {
    type: [Number, String],
    required: true,
  },
})

const { showToast } = useToast()
const pitch = ref(null)
const loading = ref(true)
const error = ref('')

const SURFACE_LABELS = {
  grass: 'Natural grass',
  artificial_turf: 'Artificial turf',
  indoor: 'Indoor',
}

// Google Maps needs no API key for either of these: a plain
// search-by-coordinates link, or the classic `/maps?...&output=embed`
// iframe src — both fall back to searching by address text for the rare
// pitch without lat/lng on file.
const mapsQuery = computed(() => {
  if (!pitch.value) return ''
  return pitch.value.lat != null && pitch.value.lng != null
    ? `${pitch.value.lat},${pitch.value.lng}`
    : pitch.value.address
})
const mapsUrl = computed(() =>
  mapsQuery.value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery.value)}`
    : '#'
)
const mapsEmbedSrc = computed(() =>
  mapsQuery.value
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery.value)}&z=15&output=embed`
    : ''
)

const ownerInitials = computed(() => {
  const name = pitch.value?.owner?.name
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    pitch.value = await fetchPitch(props.id)
  } catch (err) {
    error.value = err.response?.data?.message || 'Pitch not found.'
  } finally {
    loading.value = false
  }
}

// Stay on the pitch page after booking (the player might want to book
// another slot right away) and just confirm with a toast instead of
// navigating them away to My bookings.
function handleBooked() {
  showToast('Booking confirmed!')
}

onMounted(load)
</script>

<template>
  <div>
    <p v-if="loading" class="text-slate-500">Loading…</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <div v-else-if="pitch" class="space-y-6">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <div class="relative flex h-64 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-400">
            <img
              v-if="pitch.photos?.[0]"
              :src="pitch.photos[0]"
              :alt="pitch.name"
              class="h-full w-full object-cover"
            />
            <PhotoIcon v-else class="h-14 w-14" />
            <span
              class="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-amber-600 shadow-sm"
            >
              €{{ Number(pitch.pricePerHour).toFixed(2) }} <span class="font-normal text-slate-500">/ hour</span>
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">{{ pitch.name }}</h1>
            <div v-if="pitch.reviewCount > 0" class="mt-1 flex items-center gap-1.5">
              <StarRating :rating="pitch.avgRating" />
              <span class="text-sm text-slate-500">
                {{ pitch.avgRating.toFixed(1) }} ({{ pitch.reviewCount }} review{{ pitch.reviewCount > 1 ? 's' : '' }})
              </span>
            </div>
            <a
              :href="mapsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 flex items-center gap-1.5 text-slate-500 hover:text-indigo-700 hover:underline"
            >
              <MapPinIcon class="h-4 w-4 shrink-0" />
              {{ pitch.address }}
            </a>

            <div class="mt-3 flex flex-wrap gap-2 text-sm">
              <span class="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                {{ SURFACE_LABELS[pitch.surfaceType] ?? pitch.surfaceType }}
              </span>
              <span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">{{ pitch.size }}</span>
              <span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                {{ pitch.openTime.slice(0, 5) }}–{{ pitch.closeTime.slice(0, 5) }}
              </span>
            </div>
          </div>

          <div v-if="pitch.owner" class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {{ ownerInitials }}
            </span>
            <div class="text-sm">
              <p class="text-slate-400">Managed by</p>
              <p class="font-medium text-slate-800">{{ pitch.owner.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <BookingForm :pitch="pitch" @booked="handleBooked" />

      <div class="overflow-hidden rounded-xl border border-slate-200">
        <iframe
          :src="mapsEmbedSrc"
          class="h-[32rem] w-full"
          style="border: 0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          :title="`Map showing ${pitch.name}`"
        ></iframe>
      </div>

      <PitchReviews :pitch-id="pitch.id" />
    </div>
  </div>
</template>
