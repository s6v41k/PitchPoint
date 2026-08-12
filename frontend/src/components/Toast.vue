<script setup>
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useToast } from '../composables/useToast'

const { toast } = useToast()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="toast.visible"
      class="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-lg shadow-slate-900/10"
    >
      <CheckCircleIcon class="h-5 w-5 shrink-0 text-emerald-600" />
      {{ toast.message }}
    </div>
  </Transition>
</template>
