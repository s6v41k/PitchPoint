import client from './client'

export function fetchReviews(pitchId) {
  return client.get(`/pitches/${pitchId}/reviews`).then((res) => res.data)
}

export function submitReview(pitchId, payload) {
  // payload: { rating, comment? }
  return client.post(`/pitches/${pitchId}/reviews`, payload).then((res) => res.data)
}

export function deleteReview(pitchId) {
  return client.delete(`/pitches/${pitchId}/reviews`)
}
