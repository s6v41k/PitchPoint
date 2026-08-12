import client from './client'

// `filters` is a plain object like { search, surfaceType, size }; axios
// serializes it to a query string and drops any undefined values.
export function fetchPitches(filters = {}) {
  return client.get('/pitches', { params: filters }).then((res) => res.data)
}

export function fetchMyPitches() {
  return client.get('/pitches/mine').then((res) => res.data)
}

export function fetchPitch(id) {
  return client.get(`/pitches/${id}`).then((res) => res.data)
}

export function fetchPitchBookings(id, date) {
  return client
    .get(`/pitches/${id}/bookings`, { params: { date } })
    .then((res) => res.data)
}

export function createPitch(payload) {
  return client.post('/pitches', payload).then((res) => res.data)
}

export function updatePitch(id, payload) {
  return client.put(`/pitches/${id}`, payload).then((res) => res.data)
}

export function deletePitch(id) {
  return client.delete(`/pitches/${id}`)
}
