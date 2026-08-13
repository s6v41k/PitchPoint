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
  return client.get(`/pitches/${id}/bookings`, { params: { date } }).then((res) => res.data)
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

// `date` is optional — omitted, this returns every upcoming closure for
// the pitch (used by the owner's management panel); passed, it's filtered
// to that one day (used by the availability grid).
export function fetchClosures(id, date) {
  return client.get(`/pitches/${id}/closures`, { params: { date } }).then((res) => res.data)
}

export function createClosure(id, payload) {
  return client.post(`/pitches/${id}/closures`, payload).then((res) => res.data)
}

export function deleteClosure(id, closureId) {
  return client.delete(`/pitches/${id}/closures/${closureId}`)
}

export function fetchMyWaitlistEntries(id) {
  return client.get(`/pitches/${id}/waitlist/mine`).then((res) => res.data)
}

export function joinWaitlist(id, payload) {
  return client.post(`/pitches/${id}/waitlist`, payload).then((res) => res.data)
}

export function leaveWaitlist(id, entryId) {
  return client.delete(`/pitches/${id}/waitlist/${entryId}`)
}
