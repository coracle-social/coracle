import './app.css'
import App from './App.svelte'

// Annoying global always fails silently. Figure out an eslint rule instead
window.find = null

const app = new App({
  target: document.getElementById('app')
})

export default app
