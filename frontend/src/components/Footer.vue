<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="flex flex-col items-start justify-between gap-6 sm:flex-row">
        <div class="flex items-center gap-2 text-lg font-bold text-indigo-700">
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-amber-400">
            <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path
                d="M12 2 L14.5 9 L21 9.5 L15.8 14 L17.5 21 L12 17 L6.5 21 L8.2 14 L3 9.5 L9.5 9 Z"
                fill="currentColor"
              />
            </svg>
          </span>
          PitchPoint
        </div>

        <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
          <RouterLink :to="{ name: 'browse-pitches' }" class="hover:text-indigo-700">Browse pitches</RouterLink>
          <RouterLink :to="{ name: 'my-bookings' }" class="hover:text-indigo-700">My bookings</RouterLink>
          <RouterLink :to="{ name: 'register' }" class="hover:text-indigo-700">Sign up</RouterLink>
        </nav>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-6 text-xs text-slate-400">
        © {{ year }} PitchPoint — book football pitches across Brussels in a few clicks.
      </div>
    </div>
  </footer>
</template>
