import { hideMessage, displayMessage, showView } from './auth-ui.js'

let lastRecoveryEmail = ''

export function initEventListeners(uiElements, webAuth, databaseConnection) {
  // Form handling
  if (uiElements.loginForm)
    uiElements.loginForm.addEventListener('submit', (e) =>
      handleLogin(e, uiElements, webAuth, databaseConnection)
    )

  if (uiElements.signupForm)
    uiElements.signupForm.addEventListener('submit', (e) =>
      handleSignup(e, uiElements, webAuth, databaseConnection)
    )

  if (uiElements.forgotPasswordForm)
    uiElements.forgotPasswordForm.addEventListener('submit', (e) =>
      handleForgotPassword(e, uiElements, webAuth, databaseConnection)
    )
  if (uiElements.resendEmailLink)
    uiElements.resendEmailLink.addEventListener('click', (e) =>
      handleResendEmail(e, uiElements, webAuth, databaseConnection)
    )

  // Social Links
  if (uiElements.btnGoogle)
    uiElements.btnGoogle.addEventListener('click', function () {
      loginWithProvider('google-oauth2', webAuth)
    })
  if (uiElements.btnMicrosoft)
    uiElements.btnMicrosoft.addEventListener('click', function () {
      loginWithProvider('windowslive', webAuth)
    })

  const viewSwitchLinks = [
    { el: uiElements.loginForgotPasswordLink, view: 'forgotPassword' },
    { el: uiElements.loginSignupLink, view: 'signup' },
    { el: uiElements.signupLoginLink, view: 'login' },
    { el: uiElements.forgotSigninLink, view: 'login' },
    { el: uiElements.btnBackToSignin, view: 'login' },
  ]

  viewSwitchLinks.forEach((item) => {
    if (item.el) {
      item.el.addEventListener('click', function (e) {
        e.preventDefault()
        showView(item.view)
      })
    }
  })
}

function handleLogin(e, uiElements, webAuth, databaseConnection) {
  e.preventDefault()
  hideMessage()
  uiElements.btnLogin.disabled = true
  uiElements.btnLogin.textContent = 'Signing in...'

  webAuth.login(
    {
      realm: databaseConnection,
      username: uiElements.loginEmailInput.value.trim(),
      password: uiElements.loginPasswordInput.value,
    },
    function (err) {
      uiElements.btnLogin.disabled = false
      uiElements.btnLogin.textContent = 'Sign in'
      if (err) {
        console.error('Login error:', err)
        const errorMessage = getFriendlyErrorMessage(err, 'Login failed. Please try again.')
        return displayMessage(errorMessage)
      }
    }
  )
}

function handleSignup(e, uiElements, webAuth, databaseConnection) {
  e.preventDefault()
  hideMessage()
  uiElements.btnSignup.disabled = true
  uiElements.btnSignup.textContent = 'Signing up...'

  webAuth.signup(
    {
      connection: databaseConnection,
      email: uiElements.signupEmailInput.value.trim(),
      password: uiElements.signupPasswordInput.value,
      name: uiElements.signupNameInput.value.trim(),
    },
    function (err, result) {
      uiElements.btnSignup.disabled = false
      uiElements.btnSignup.textContent = 'Sign up'
      if (err) {
        console.error('Signup error:', err)
        const errorMessage = getFriendlyErrorMessage(err, 'Signup failed. Please try again.')
        return displayMessage(errorMessage)
      }

      displayMessage(
        'Signup successful! Please check your email to verify your account (if required), or try logging in.',
        'success'
      )
    }
  )
}

function handleForgotPassword(e, uiElements, webAuth, databaseConnection) {
  e.preventDefault()
  hideMessage()
  const email = uiElements.forgotEmailInput.value.trim()
  if (!email) {
    return displayMessage('Please enter your email address.')
  }
  lastRecoveryEmail = email

  uiElements.btnSendRecovery.disabled = true
  uiElements.btnSendRecovery.textContent = 'Sending...'

  webAuth.changePassword(
    {
      connection: databaseConnection,
      email: email,
    },
    function (err, res) {
      uiElements.btnSendRecovery.disabled = false
      uiElements.btnSendRecovery.textContent = 'Send recovery link'
      if (err) {
        console.error('Forgot password error:', err)
        const friendlyError = getFriendlyErrorMessage(
          err,
          'Failed to send recovery email. Please try again.'
        )
        return displayMessage(friendlyError)
      }
      uiElements.recoveryEmailDisplay.textContent = lastRecoveryEmail
      showView('emailSent')
    }
  )
}

function handleResendEmail(e, uiElements, webAuth, databaseConnection) {
  e.preventDefault()
  hideMessage()
  if (!lastRecoveryEmail) {
    return displayMessage('No email address found to resend. Please try "Forgot Password" again.')
  }

  const originalText = uiElements.resendEmailLink.textContent
  uiElements.resendEmailLink.textContent = 'Resending...'
  uiElements.resendEmailLink.style.pointerEvents = 'none'

  webAuth.changePassword(
    {
      connection: databaseConnection,
      email: lastRecoveryEmail,
    },
    function (err, res) {
      uiElements.resendEmailLink.textContent = originalText
      uiElements.resendEmailLink.style.pointerEvents = 'auto'
      if (err) {
        console.error('Resend email error:', err)
        const errorMessage = getFriendlyErrorMessage(err, 'Failed to resend recovery email.')
        return displayMessage(errorMessage)
      }
      displayMessage(`Recovery email resent to ${lastRecoveryEmail}.`, 'success')
    }
  )
}

function loginWithProvider(connectionName, webAuth) {
  hideMessage()
  webAuth.authorize(
    {
      connection: connectionName,
    },
    function (err) {
      if (err) {
        console.error(`Social login error (${connectionName}):`, err)
        const errorMessage = getFriendlyErrorMessage(err, `Login with ${connectionName} failed.`)
        displayMessage(errorMessage)
      }
    }
  )
}

function getFriendlyErrorMessage(err, defaultMessage) {
  if (!err) return defaultMessage

  if (err.policy && typeof err.policy === 'string') {
    return err.policy
  }

  if (err.description && typeof err.description === 'string') {
    return err.description
  }

  if (err.error_description && typeof err.error_description === 'string') {
    return err.error_description
  }

  if (err.message && typeof err.message === 'string') {
    return err.message
  }

  if (
    err.description &&
    typeof err.description === 'object' &&
    err.description.message &&
    typeof err.description.message === 'string'
  ) {
    return err.description.message
  }

  return defaultMessage
}
