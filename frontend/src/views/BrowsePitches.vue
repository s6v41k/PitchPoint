<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { MagnifyingGlassIcon, FaceFrownIcon } from '@heroicons/vue/24/outline'
import PitchCard from '../components/PitchCard.vue'
import { fetchPitches } from '../api/pitches'

const pitches = ref([])
const loading = ref(true)
const error = ref('')

// Bound directly to the filter form; only non-empty fields end up in the
// querystring (see fetchPitches -> api/client -> axios `params`).
const filters = reactive({
  search: '',
  surfaceType: '',
  size: '',
  minPrice: '',
  maxPrice: '',
})

const resultCountLabel = computed(() => {
  const n = pitches.value.length
  return n === 1 ? '1 pitch found' : `${n} pitches found`
})

async function loadPitches() {
  loading.value = true
  error.value = ''
  try {
    pitches.value = await fetchPitches(filters)
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load pitches.'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.surfaceType = ''
  filters.size = ''
  filters.minPrice = ''
  filters.maxPrice = ''
  loadPitches()
}

onMounted(loadPitches)
</script>

<template>
  <div>
    <div class="-mx-4 rounded-b-2xl bg-gradient-to-r from-indigo-700 to-indigo-900 px-4 py-8 sm:-mx-0 sm:rounded-2xl sm:px-8">
      <h1 class="text-2xl font-bold text-white sm:text-3xl">Find a pitch near you</h1>
      <p class="mt-1 text-indigo-100">
        Search and filter pitches, then book a time slot in a few clicks.
      </p>
    </div>

    <form
      class="relative z-10 mt-[-1.5rem] grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 sm:grid-cols-3 lg:grid-cols-6"
      @submit.prevent="loadPitches"
    >
      <div class="relative col-span-2 sm:col-span-1 lg:col-span-2">
        <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="filters.search"
          type="text"
          placeholder="Name or address"
          class="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <select
        v-model="filters.surfaceType"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Any surface</option>
        <option value="grass">Natural grass</option>
        <option value="artificial_turf">Artificial turf</option>
        <option value="indoor">Indoor</option>
      </select>
      <select
        v-model="filters.size"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Any size</option>
        <option value="5v5">5v5</option>
        <option value="7v7">7v7</option>
        <option value="11v11">11v11</option>
      </select>
      <input
        v-model="filters.minPrice"
        type="number"
        min="0"
        placeholder="Min €/h"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <input
        v-model="filters.maxPrice"
        type="number"
        min="0"
        placeholder="Max €/h"
        class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      <div class="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
        <button
          type="submit"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
        <button
          type="button"
          class="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
          @click="resetFilters"
        >
          Reset
        </button>
      </div>
    </form>

    <p v-if="error" class="mt-6 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="loading" class="mt-6 text-slate-500">Loading pitches…</p>

    <template v-else>
      <div v-if="pitches.length === 0" class="mt-10 flex flex-col items-center gap-2 py-10 text-center">
        <FaceFrownIcon class="h-10 w-10 text-slate-300" />
        <p class="text-slate-500">No pitches match your search.</p>
      </div>

      <template v-else>
        <p class="mt-6 text-sm font-medium text-slate-400">{{ resultCountLabel }}</p>
        <div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PitchCard v-for="pitch in pitches" :key="pitch.id" :pitch="pitch" />
        </div>
      </template>
    </template>
  </div>
</template>
