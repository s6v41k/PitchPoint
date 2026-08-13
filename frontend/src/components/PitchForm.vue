<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  // Pass an existing pitch to edit it, or omit/null to create a new one.
  initial: {
    type: Object,
    default: null,
  },
})
const emit = defineEmits(['submit', 'cancel'])

function blankForm() {
  return {
    name: '',
    address: '',
    lat: '',
    lng: '',
    surfaceType: 'grass',
    size: '7v7',
    pricePerHour: '',
    photosText: '',
    openTime: '07:00',
    closeTime: '23:00',
  }
}

// Bookings (and opening hours) only ever land on the hour — see backend
// pitchRoutes.js/bookingRoutes.js — so these dropdowns just offer every
// hour of the day rather than a free-form time picker.
const hourOptions = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

const form = reactive(blankForm())

// Whenever a different pitch is passed in (e.g. clicking "Edit" on
// another row), repopulate the form instead of keeping the previous
// pitch's values.
watch(
  () => props.initial,
  (pitch) => {
    Object.assign(form, blankForm())
    if (pitch) {
      form.name = pitch.name
      form.address = pitch.address
      form.lat = pitch.lat ?? ''
      form.lng = pitch.lng ?? ''
      form.surfaceType = pitch.surfaceType
      form.size = pitch.size
      form.pricePerHour = pitch.pricePerHour
      form.photosText = (pitch.photos || []).join('\n')
      form.openTime = pitch.openTime?.slice(0, 5) ?? '07:00'
      form.closeTime = pitch.closeTime?.slice(0, 5) ?? '23:00'
    }
  },
  { immediate: true }
)

function handleSubmit() {
  emit('submit', {
    name: form.name,
    address: form.address,
    lat: form.lat === '' ? null : Number(form.lat),
    lng: form.lng === '' ? null : Number(form.lng),
    surfaceType: form.surfaceType,
    size: form.size,
    pricePerHour: Number(form.pricePerHour),
    // One URL per line in the textarea -> array of non-empty URLs.
    photos: form.photosText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    openTime: form.openTime,
    closeTime: form.closeTime,
  })
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
</script>

<template>
  <form
    class="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    @submit.prevent="handleSubmit"
  >
    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2">
        <label class="block text-sm font-medium text-slate-600">Name</label>
        <input v-model="form.name" type="text" required :class="inputClass" />
      </div>
      <div class="col-span-2">
        <label class="block text-sm font-medium text-slate-600">Address</label>
        <input v-model="form.address" type="text" required :class="inputClass" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Latitude (optional)</label>
        <input v-model="form.lat" type="number" step="any" :class="inputClass" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Longitude (optional)</label>
        <input v-model="form.lng" type="number" step="any" :class="inputClass" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Surface</label>
        <select v-model="form.surfaceType" :class="inputClass">
          <option value="grass">Natural grass</option>
          <option value="artificial_turf">Artificial turf</option>
          <option value="indoor">Indoor</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Size</label>
        <select v-model="form.size" :class="inputClass">
          <option value="5v5">5v5</option>
          <option value="7v7">7v7</option>
          <option value="11v11">11v11</option>
        </select>
      </div>
      <div class="col-span-2">
        <label class="block text-sm font-medium text-slate-600">Price per hour (€)</label>
        <input
          v-model="form.pricePerHour"
          type="number"
          min="0"
          step="0.01"
          required
          :class="inputClass"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Opens at</label>
        <select v-model="form.openTime" :class="inputClass">
          <option v-for="h in hourOptions" :key="h" :value="h">{{ h }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">Closes at</label>
        <select v-model="form.closeTime" :class="inputClass">
          <option v-for="h in hourOptions" :key="h" :value="h">{{ h }}</option>
        </select>
      </div>
      <div class="col-span-2">
        <label class="block text-sm font-medium text-slate-600"
          >Photo URLs (one per line, optional)</label
        >
        <textarea v-model="form.photosText" rows="2" :class="inputClass"></textarea>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        type="submit"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        {{ initial ? 'Save changes' : 'Create pitch' }}
      </button>
      <button
        type="button"
        class="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>
