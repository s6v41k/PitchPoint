import { reactive } from 'vue'

// A single shared (module-level) reactive object, not a Pinia store: the
// toast is pure ephemeral UI state (not app data), and every caller of
// useToast() across the app needs to read/write the *same* instance so
// showToast() from one component is seen by the <Toast> in App.vue.
const state = reactive({ message: '', visible: false })
let hideTimer = null

export function useToast() {
  function showToast(message, duration = 4000) {
    state.message = message
    state.visible = true
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      state.visible = false
    }, duration)
  }

  return { toast: state, showToast }
}
