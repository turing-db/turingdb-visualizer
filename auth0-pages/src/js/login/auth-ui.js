const eyeIcon = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_3207_3638)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.0025 7.00268C7.45335 7.00268 7.00406 7.45385 7.00406 8.00528C7.00406 8.5567 7.45335 9.00787 8.0025 9.00787C8.55164 9.00787 9.00094 8.5567 9.00094 8.00528C9.00094 7.45385 8.55164 7.00268 8.0025 7.00268ZM15.99 7.9752C15.99 7.96517 15.99 7.96517 15.99 7.95515V7.94512C15.99 7.93509 15.99 7.93509 15.99 7.92507C15.99 7.91504 15.99 7.91504 15.99 7.90502C15.97 7.76465 15.9101 7.64434 15.8203 7.54408C15.3111 6.87234 14.702 6.28081 14.083 5.73941C12.7551 4.56637 11.2374 3.58383 9.56006 3.19282C8.58159 2.9522 7.6131 2.94217 6.63463 3.13266C5.74602 3.31313 4.89735 3.67407 4.08861 4.12523C2.84056 4.83708 1.69236 5.80959 0.693916 6.90242C0.514197 7.11297 0.334477 7.31349 0.164743 7.53406C-0.0549142 7.82481 -0.0549142 8.17572 0.164743 8.46647C0.673947 9.13821 1.283 9.72974 1.90203 10.2711C3.22995 11.4442 4.74758 12.4267 6.42496 12.8177C7.39345 13.0483 8.37192 13.0584 9.35039 12.8578C10.239 12.6774 11.0877 12.3164 11.8964 11.8653C13.1445 11.1534 14.2927 10.1809 15.2911 9.08808C15.4708 8.88756 15.6605 8.67702 15.8303 8.45644C15.9201 8.35618 15.98 8.22585 16 8.09551C16 8.08548 16 8.08548 16 8.07546C16 8.06543 16 8.06543 16 8.05541V8.04538C16 8.03535 16 8.03535 16 8.02533C16 8.0153 16 8.00528 16 7.99525C16 7.98522 15.99 7.98522 15.99 7.9752ZM8.0025 11.0131C6.34509 11.0131 5.00718 9.66958 5.00718 8.00528C5.00718 6.34097 6.34509 4.99749 8.0025 4.99749C9.65991 4.99749 10.9978 6.34097 10.9978 8.00528C10.9978 9.66958 9.65991 11.0131 8.0025 11.0131Z" fill="#747880" />
  </g>
  <defs>
    <clipPath id="clip0_3207_3638">
      <rect width="16" height="16" fill="white" />
    </clipPath>
  </defs>
</svg>
`

const eyeIconOff = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_2989_5972)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 7.97C16 7.96 16 7.96 16 7.95V7.94C16 7.93 16 7.93 16 7.92C16 7.91 16 7.91 16 7.9C15.98 7.76 15.92 7.64 15.83 7.54C15.34 6.91 14.76 6.34 14.18 5.82L11.02 8.08C10.98 9.69 9.66 10.98 8.04 10.98C7.73 10.98 7.44 10.92 7.16 10.83L5.09 12.3C5.53 12.49 5.99 12.66 6.46 12.77C7.43 13 8.4 13.01 9.38 12.82C10.26 12.65 11.12 12.28 11.91 11.84C13.16 11.14 14.3 10.17 15.29 9.09C15.47 8.89 15.66 8.68 15.82 8.47C15.91 8.37 15.97 8.25 15.99 8.11C15.99 8.1 15.99 8.1 15.99 8.09C15.99 8.08 15.99 8.08 15.99 8.07V8.06C15.99 8.05 15.99 8.05 15.99 8.04C15.99 8.03 15.99 8.02 15.99 8.01C16 7.99 16 7.98 16 7.97ZM15.57 3.8C15.82 3.62 16 3.34 16 3C16 2.45 15.55 2 15 2C14.78 2 14.59 2.08 14.43 2.2L14.42 2.19L11.75 4.1C11.06 3.72 10.34 3.41 9.58 3.23C8.62 3 7.64 2.99 6.67 3.18C5.79 3.36 4.93 3.72 4.14 4.17C2.89 4.87 1.75 5.84 0.76 6.92C0.58 7.12 0.39 7.33 0.23 7.54C0 7.83 0 8.17 0.22 8.46C0.73 9.12 1.33 9.71 1.95 10.25C2.13 10.41 2.33 10.54 2.51 10.69L0.42 12.19L0.43 12.2C0.18 12.38 0 12.66 0 13C0 13.55 0.45 14 1 14C1.22 14 1.41 13.92 1.57 13.8L1.58 13.81L15.58 3.81L15.57 3.8ZM5.16 8.8C5.09 8.54 5.05 8.28 5.05 8C5.05 6.36 6.39 5.02 8.04 5.02C8.66 5.02 9.23 5.23 9.7 5.55L5.16 8.8Z" fill="#747880" />
  </g>
  <defs>
    <clipPath id="clip0_2989_5972">
      <rect width="16" height="16" fill="white" />
    </clipPath>
  </defs>
</svg>
`

export function initUIElements() {
  // Forms
  const loginForm = document.getElementById('login-form')
  const signupForm = document.getElementById('signup-form')
  const forgotPasswordForm = document.getElementById('forgot-password-form')

  // Buttons
  const btnLogin = document.getElementById('btn-login')
  const btnGoogle = document.getElementById('btn-google')
  const btnMicrosoft = document.getElementById('btn-microsoft')
  const btnSignup = document.getElementById('btn-signup')
  const btnSendRecovery = document.getElementById('btn-send-recovery')
  const btnBackToSignin = document.getElementById('btn-back-to-signin')

  // Links
  const loginForgotPasswordLink = document.getElementById('login-forgot-password-link')
  const loginSignupLink = document.getElementById('login-signup-link')
  const signupLoginLink = document.getElementById('signup-login-link')
  const forgotSigninLink = document.getElementById('forgot-signin-link')
  const resendEmailLink = document.getElementById('resend-email-link')

  // Input fields
  const loginEmailInput = document.getElementById('login-email')
  const loginPasswordInput = document.getElementById('login-password')
  const signupNameInput = document.getElementById('signup-name')
  const signupEmailInput = document.getElementById('signup-email')
  const signupPasswordInput = document.getElementById('signup-password')
  const forgotEmailInput = document.getElementById('forgot-email')
  const recoveryEmailDisplay = document.getElementById('recovery-email-display')

  // Password Visibility Toggle
  document.querySelectorAll('.toggle-password').forEach((toggle) => {
    toggle.addEventListener('click', function () {
      const inputId = this.getAttribute('data-for')
      const passwordInput = document.getElementById(inputId)
      if (passwordInput) {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'
        passwordInput.setAttribute('type', type)
        this.innerHTML = type === 'password' ? eyeIcon : eyeIconOff
      }
    })
  })

  return {
    loginForm,
    signupForm,
    forgotPasswordForm,
    btnLogin,
    btnGoogle,
    btnMicrosoft,
    btnSignup,
    btnSendRecovery,
    btnBackToSignin,
    loginForgotPasswordLink,
    loginSignupLink,
    signupLoginLink,
    forgotSigninLink,
    resendEmailLink,
    loginEmailInput,
    loginPasswordInput,
    signupNameInput,
    signupEmailInput,
    signupPasswordInput,
    forgotEmailInput,
    recoveryEmailDisplay,
  }
}

// --- View Management ---
export function showView(viewName) {
  const views = {
    login: document.getElementById('login-view'),
    signup: document.getElementById('signup-view'),
    forgotPassword: document.getElementById('forgot-password-view'),
    emailSent: document.getElementById('email-sent-view'),
  }

  hideMessage()
  for (const key in views) {
    if (views[key]) views[key].classList.remove('active')
  }
  if (views[viewName]) {
    views[viewName].classList.add('active')

    if (viewName === 'login') document.title = 'Sign In'
    else if (viewName === 'signup') document.title = 'Sign Up'
    else if (viewName === 'forgotPassword') document.title = 'Forgot Password'
    else if (viewName === 'emailSent') document.title = 'Check Your Email'
  }
}

// --- Message Display ---
export function displayMessage(message, type = 'error') {
  const globalMessageArea = document.getElementById('global-message-area')

  globalMessageArea.textContent = message
  globalMessageArea.className = `message-area ${type}`
  globalMessageArea.style.display = 'block'
}
export function hideMessage() {
  const globalMessageArea = document.getElementById('global-message-area')

  globalMessageArea.style.display = 'none'
  globalMessageArea.textContent = ''
  globalMessageArea.className = 'message-area'
}
