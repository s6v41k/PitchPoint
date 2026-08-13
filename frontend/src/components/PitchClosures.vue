<script setup>
import { onMounted, reactive, ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { fetchClosures, createClosure, deleteClosure } from '../api/pitches'

const props = defineProps({
  pitchId: {
    type: [Number, String],
    required: true,
  },
})

const closures = ref([])
const loading = ref(true)
const error = ref('')

const pad = (n) => String(n).padStart(2, '0')
const hourOptions = Array.from({ length: 24 }, (_, h) => h)

const form = reactive({
  date: '',
  startHour: 8,
  endHour: 9,
  reason: '',
})
const submitting = ref(false)
const formError = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    // No date param -> every upcoming closure for this pitch.
    closures.value = await fetchClosures(props.pitchId)
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load closures.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  formError.value = ''
  if (!form.date) {
    formError.value = 'Pick a date.'
    return
  }
  if (Number(form.endHour) <= Number(form.startHour)) {
    formError.value = 'End time must be after start time.'
    return
  }

  submitting.value = true
  try {
    const closure = await createClosure(props.pitchId, {
      date: form.date,
      startTime: `${pad(form.startHour)}:00`,
      endTime: `${pad(form.endHour)}:00`,
      reason: form.reason || undefined,
    })
    closures.value.push(closure)
    closures.value.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    form.reason = ''
  } catch (err) {
    formError.value = err.response?.data?.message || 'Could not add this closure.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(closure) {
  error.value = ''
  try {
    await deleteClosure(props.pitchId, closure.id)
    closures.value = closures.value.filter((c) => c.id !== closure.id)
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not remove this closure.'
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

onMounted(load)
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-slate-900">Closures</h3>
    <p class="mt-0.5 text-xs text-slate-500">
      Block out maintenance, holidays, or other one-off exceptions to your normal hours.
    </p>

    <form class="mt-3 flex flex-wrap items-end gap-2" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-xs font-medium text-slate-500">Date</label>
        <input
          v-model="form.date"
          type="date"
          required
          class="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-500">From</label>
        <select
          v-model.number="form.startHour"
          class="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option v-for="h in hourOptions" :key="h" :value="h">{{ pad(h) }}:00</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-500">To</label>
        <select
          v-model.number="form.endHour"
          class="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option v-for="h in hourOptions" :key="h" :value="h">{{ pad(h) }}:00</option>
        </select>
      </div>
      <div class="min-w-[8rem] flex-1">
        <label class="block text-xs font-medium text-slate-500">Reason (optional)</label>
        <input
          v-model="form.reason"
          type="text"
          placeholder="e.g. Maintenance"
          class="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        :disabled="submitting"
        class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Add
      </button>
    </form>
    <p v-if="formError" class="mt-1 text-xs text-red-600">{{ formError }}</p>

    <p v-if="loading" class="mt-3 text-sm text-slate-400">Loading…</p>
    <p v-else-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="closures.length === 0" class="mt-3 text-sm text-slate-400">
      No upcoming closures.
    </p>
    <ul v-else class="mt-3 space-y-1.5">
      <li
        v-for="c in closures"
        :key="c.id"
        class="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-1.5 text-sm"
      >
        <span class="text-slate-700">
          <span class="font-medium"
            >{{ formatDate(c.date) }}, {{ c.startTime.slice(0, 5) }}–{{
              c.endTime.slice(0, 5)
            }}</span
          >
          <span v-if="c.reason" class="text-slate-500"> — {{ c.reason }}</span>
        </span>
        <button type="button" class="text-slate-400 hover:text-red-600" @click="handleDelete(c)">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </li>
    </ul>
  </div>
</template>
