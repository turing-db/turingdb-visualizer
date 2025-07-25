import { initAuth0ConfigMock } from './auth-config.mock.js'
import { initAuth0Config } from './auth-config.js'
import { initEventListeners } from './auth-event-listeners.js'
import { initUIElements, showView } from './auth-ui.js'

window.addEventListener('load', function () {
  const initAuth0ConfigFunc = import.meta.env.DEV ? initAuth0ConfigMock : initAuth0Config
  const { webAuth, databaseConnection } = initAuth0ConfigFunc()
  const uiElements = initUIElements()
  initEventListeners(uiElements, webAuth, databaseConnection)

  // Initial view
  showView('login')

  // Handle potential query params from Auth0 (e.g., error messages)
  const urlParams = new URLSearchParams(window.location.search)
  const error = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')
  if (error && errorDescription) {
    displayMessage(decodeURIComponent(errorDescription))
    // Clean the URL
    window.history.replaceState({}, document.title, window.location.pathname)
  }
})
