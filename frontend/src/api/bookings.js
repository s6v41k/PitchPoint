import client from './client'

export function fetchMyBookings() {
  return client.get('/bookings/me').then((res) => res.data)
}

export function fetchOwnerBookings() {
  return client.get('/bookings/owner').then((res) => res.data)
}

export function createBooking(payload) {
  // payload: { pitchId, date, startTime, endTime }
  return client.post('/bookings', payload).then((res) => res.data)
}

export function cancelBooking(id) {
  return client.delete(`/bookings/${id}`).then((res) => res.data)
}
