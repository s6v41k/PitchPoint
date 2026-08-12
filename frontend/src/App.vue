<script setup>
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import Toast from './components/Toast.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Toast />

    <!-- The welcome page is a full-bleed landing page with its own header
    and footer (see WelcomeView.vue), so the app chrome (navbar + centered
    container + footer) only applies to every other route. -->
    <template v-if="route.name === 'welcome'">
      <RouterView />
    </template>
    <template v-else>
      <div class="flex min-h-screen flex-col">
        <Navbar />
        <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <RouterView />
        </main>
        <Footer />
      </div>
    </template>
  </div>
</template>
