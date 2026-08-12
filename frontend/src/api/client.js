import axios from 'axios'

// A single configured axios instance used by every api/*.js module, so the
// base URL and auth header logic live in exactly one place.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Runs before every request: if we have a JWT saved (see stores/auth.js),
// attach it as a Bearer token. This is simpler than passing the token
// down to each individual api call.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pitchpoint_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
