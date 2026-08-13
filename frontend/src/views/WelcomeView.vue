<script setup>
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline'

const features = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Search nearby pitches',
    text: 'Filter by surface, size and price to find a pitch that fits your game, near you.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Real-time availability',
    text: 'See exactly which slots are free and book instantly — no phone calls, no paper forms.',
  },
  {
    icon: BuildingOffice2Icon,
    title: 'Built for owners too',
    text: 'Clubs, communes and private facilities manage pitches and bookings from one dashboard.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="bg-gradient-to-b from-indigo-950 to-indigo-900">
      <!-- Minimal top bar: the full Navbar is intentionally hidden on this route (see App.vue) so the landing page can own its own header. -->
      <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div class="flex items-center gap-2 text-lg font-bold text-white">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-indigo-950"
          >
            <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path
                d="M12 2 L14.5 9 L21 9.5 L15.8 14 L17.5 21 L12 17 L6.5 21 L8.2 14 L3 9.5 L9.5 9 Z"
                fill="currentColor"
              />
            </svg>
          </span>
          PitchPoint
        </div>
        <div class="flex items-center gap-3 text-sm font-medium">
          <RouterLink to="/login" class="text-indigo-100 hover:text-white">Log in</RouterLink>
          <RouterLink
            to="/register"
            class="rounded-md bg-amber-400 px-4 py-2 font-semibold text-indigo-950 hover:bg-amber-300"
          >
            Sign up
          </RouterLink>
        </div>
      </header>

      <!-- Hero -->
      <section class="relative overflow-hidden px-6 pb-28 pt-10 sm:pt-16">
        <div
          class="pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-amber-400/20 blur-3xl"
        ></div>
        <div
          class="pointer-events-none absolute top-40 left-[-10%] h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
        ></div>

        <div class="relative mx-auto max-w-3xl text-center">
          <span
            class="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300"
          >
            Booking football pitches, simplified
          </span>
          <h1 class="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Find a pitch. Pick a time.
            <span class="text-amber-400">Play.</span>
          </h1>
          <p class="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            PitchPoint replaces slow phone calls and paper booking sheets with live availability and
            instant booking — for players and pitch owners alike.
          </p>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <RouterLink
              to="/register"
              class="inline-flex items-center gap-2 rounded-md bg-amber-400 px-6 py-3 font-semibold text-indigo-950 hover:bg-amber-300"
            >
              Get started
              <ArrowRightIcon class="h-4 w-4" />
            </RouterLink>
            <RouterLink
              to="/login"
              class="rounded-md border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              I already have an account
            </RouterLink>
          </div>
        </div>
      </section>
    </div>

    <!-- Feature highlights: pulled up over the hero's bottom edge so the
    dark section doesn't end on a hard, empty line. -->
    <section class="relative mx-auto -mt-16 max-w-6xl px-6 pb-16">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"
          >
            <component :is="feature.icon" class="h-5 w-5" />
          </div>
          <h3 class="mt-4 font-semibold text-slate-900">{{ feature.title }}</h3>
          <p class="mt-1 text-sm text-slate-500">{{ feature.text }}</p>
        </div>
      </div>
    </section>

    <footer class="border-t border-slate-200 py-6 text-center text-sm text-slate-400">
      PitchPoint — book football pitches across Brussels in a few clicks.
    </footer>
  </div>
</template>
