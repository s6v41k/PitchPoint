<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="flex items-center gap-2 text-lg font-bold text-indigo-700">
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-amber-400"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path
              d="M12 2 L14.5 9 L21 9.5 L15.8 14 L17.5 21 L12 17 L6.5 21 L8.2 14 L3 9.5 L9.5 9 Z"
              fill="currentColor"
            />
          </svg>
        </span>
        PitchPoint
      </div>

      <div class="mt-6 border-t border-slate-100 pt-6 text-xs text-slate-400">
        © {{ year }} PitchPoint — book football pitches across Brussels in a few clicks.
      </div>
    </div>
  </footer>
</template>
