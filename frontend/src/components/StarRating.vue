<script setup>
import { StarIcon } from '@heroicons/vue/24/solid'

defineProps({
  rating: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    default: 'h-4 w-4',
  },
})
</script>

<template>
  <span class="inline-flex items-center gap-0.5">
    <StarIcon
      v-for="n in 5"
      :key="n"
      :class="[size, n <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200']"
    />
  </span>
</template>
