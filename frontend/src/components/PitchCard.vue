<script setup>
import { MapPinIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { StarIcon } from '@heroicons/vue/24/solid'

defineProps({
  pitch: {
    type: Object,
    required: true,
  },
})

const SURFACE_LABELS = {
  grass: 'Natural grass',
  artificial_turf: 'Artificial turf',
  indoor: 'Indoor',
}
</script>

<template>
  <RouterLink
    :to="{ name: 'pitch-detail', params: { id: pitch.id } }"
    class="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/10"
  >
    <div class="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-400">
      <img
        v-if="pitch.photos?.[0]"
        :src="pitch.photos[0]"
        :alt="pitch.name"
        class="h-full w-full object-cover transition group-hover:scale-105"
      />
      <PhotoIcon v-else class="h-10 w-10" />
      <span
        class="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-600 shadow-sm"
      >
        €{{ Number(pitch.pricePerHour).toFixed(2) }}/h
      </span>
    </div>

    <div class="space-y-1.5 p-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="truncate font-semibold text-slate-900">{{ pitch.name }}</h3>
        <span v-if="pitch.reviewCount > 0" class="flex shrink-0 items-center gap-0.5 text-xs font-medium text-slate-600">
          <StarIcon class="h-3.5 w-3.5 text-amber-400" />
          {{ pitch.avgRating.toFixed(1) }}
        </span>
      </div>
      <p class="flex items-center gap-1 truncate text-sm text-slate-500">
        <MapPinIcon class="h-3.5 w-3.5 shrink-0" />
        {{ pitch.address }}
      </p>

      <div class="flex flex-wrap gap-1.5 pt-1 text-xs">
        <span class="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
          {{ SURFACE_LABELS[pitch.surfaceType] ?? pitch.surfaceType }}
        </span>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          {{ pitch.size }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
