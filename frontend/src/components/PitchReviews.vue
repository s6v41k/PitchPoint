<script setup>
import { computed, onMounted, ref } from 'vue'
import { StarIcon } from '@heroicons/vue/24/solid'
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { fetchReviews, submitReview, deleteReview } from '../api/reviews'
import StarRating from './StarRating.vue'

const props = defineProps({
  pitchId: {
    type: [Number, String],
    required: true,
  },
})

const auth = useAuthStore()

const reviews = ref([])
const loading = ref(true)
const error = ref('')
const submitting = ref(false)

const myRating = ref(0)
const hoverRating = ref(0)
const myComment = ref('')

// A player has at most one review per pitch (enforced server-side) — find
// it so the form can switch to "edit" wording and a delete option can
// show up, instead of silently overwriting it on the next submit.
const myReview = computed(() =>
  reviews.value.find((r) => r.user?.id === auth.user?.id)
)

async function load() {
  loading.value = true
  try {
    reviews.value = await fetchReviews(props.pitchId)
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  error.value = ''
  if (myRating.value === 0) {
    error.value = 'Please select a star rating.'
    return
  }
  submitting.value = true
  try {
    await submitReview(props.pitchId, { rating: myRating.value, comment: myComment.value || null })
    myRating.value = 0
    myComment.value = ''
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not submit your review.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  try {
    await deleteReview(props.pitchId)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not delete your review.'
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(load)
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-5">
    <h2 class="flex items-center gap-2 font-semibold text-slate-900">
      <ChatBubbleLeftRightIcon class="h-5 w-5 text-indigo-600" />
      Reviews
    </h2>

    <form v-if="auth.isAuthenticated" class="mt-4 space-y-2 rounded-lg bg-slate-50 p-4" @submit.prevent="handleSubmit">
      <p class="text-sm font-medium text-slate-700">
        {{ myReview ? 'Update your review' : 'Played here? Leave a review' }}
      </p>
      <div class="flex items-center gap-1" @mouseleave="hoverRating = 0">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="p-0.5"
          @mouseenter="hoverRating = n"
          @click="myRating = n"
        >
          <StarIcon :class="n <= (hoverRating || myRating || myReview?.rating || 0) ? 'text-amber-400' : 'text-slate-300'" class="h-6 w-6" />
        </button>
      </div>
      <textarea
        v-model="myComment"
        rows="2"
        placeholder="Optional comment"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      ></textarea>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <div class="flex items-center gap-3">
        <button
          type="submit"
          :disabled="submitting"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ myReview ? 'Update review' : 'Submit review' }}
        </button>
        <button
          v-if="myReview"
          type="button"
          class="text-sm font-medium text-red-600 hover:text-red-700"
          @click="handleDelete"
        >
          Delete my review
        </button>
      </div>
    </form>
    <p v-else class="mt-3 text-sm text-slate-500">
      <RouterLink to="/login" class="font-medium text-indigo-700 hover:text-indigo-800">Log in</RouterLink>
      to leave a review.
    </p>

    <p v-if="loading" class="mt-4 text-sm text-slate-400">Loading reviews…</p>
    <p v-else-if="reviews.length === 0" class="mt-4 text-sm text-slate-500">No reviews yet.</p>

    <ul v-else class="mt-4 space-y-4">
      <li v-for="review in reviews" :key="review.id" class="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
        <div class="flex items-center justify-between">
          <p class="font-medium text-slate-800">{{ review.user?.name || 'Player' }}</p>
          <span class="text-xs text-slate-400">{{ formatDate(review.createdAt) }}</span>
        </div>
        <StarRating :rating="review.rating" class="mt-1" />
        <p v-if="review.comment" class="mt-1 text-sm text-slate-600">{{ review.comment }}</p>
      </li>
    </ul>
  </div>
</template>
