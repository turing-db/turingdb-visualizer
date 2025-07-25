export function initAuth0Config() {
  const config = JSON.parse(decodeURIComponent(escape(window.atob('@@config@@'))))

  const leeway = config.internalOptions.leeway
  if (leeway) {
    const convertedLeeway = parseInt(leeway)
    if (!isNaN(convertedLeeway)) {
      config.internalOptions.leeway = convertedLeeway
    }
  }

  const params = {
    overrides: {
      __tenant: config.auth0Tenant,
      __token_issuer: config.authorizationServer.issuer,
    },
    domain: config.auth0Domain,
    clientID: config.clientID,
    redirectUri: config.callbackURL,
    responseType: 'code',
    scope: config.internalOptions.scope || 'openid profile email',
    _csrf: config.internalOptions._csrf,
    state: config.internalOptions.state,
    _intstate: config.internalOptions._intstate,
  }

  const webAuth = new auth0.WebAuth(params)
  const databaseConnection =
    config.extraParams.database_connection || 'Username-Password-Authentication'

  return { webAuth, databaseConnection }
}
