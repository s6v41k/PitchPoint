import client from './client'

export function register(payload) {
  // payload: { name, email, password, role }
  return client.post('/auth/register', payload).then((res) => res.data)
}

export function login(payload) {
  // payload: { email, password }
  return client.post('/auth/login', payload).then((res) => res.data)
}

export function fetchMe() {
  return client.get('/auth/me').then((res) => res.data)
}

export function updateMe(payload) {
  // payload: { name?, email?, currentPassword?, newPassword? }
  return client.put('/auth/me', payload).then((res) => res.data)
}

export function deleteMe() {
  return client.delete('/auth/me')
}

export function forgotPassword(email) {
  return client.post('/auth/forgot-password', { email }).then((res) => res.data)
}

export function resetPassword(token, newPassword) {
  return client.post('/auth/reset-password', { token, newPassword }).then((res) => res.data)
}

export function verifyEmail(token) {
  return client.post('/auth/verify-email', { token }).then((res) => res.data)
}

export function resendVerification() {
  return client.post('/auth/resend-verification').then((res) => res.data)
}
