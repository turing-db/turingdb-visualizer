// Mock configuration for development
// JSON.parse(decodeURIComponent(escape(window.atob('@@config@@')))) part from the originl initAuth0Config function
// will return value only when pasted into auth0 dashboard

export function initAuth0ConfigMock() {
  const mockConfig = {
    auth0Tenant: 'dev-tenant',
    authorizationServer: {
      issuer: 'https://dev-issuer.auth0.com',
    },
    auth0Domain: 'dev-domain.auth0.com',
    clientID: 'mock-client-id',
    callbackURL: 'http://localhost:3000',
    internalOptions: {
      scope: 'openid profile email',
      _csrf: 'mock-csrf-token',
      state: 'mock-state',
      _intstate: 'mock-intstate',
      leeway: '60',
    },
    extraParams: {
      database_connection: 'Username-Password-Authentication',
    },
  }

  const webAuth = {
    login: (params, callback) => {
      console.log('Mock WebAuth.login called with:', params)
      setTimeout(() => {
        // Uncomment this to simulate an error
        // callback({ description: 'Mock login error' });

        window.location.href = mockConfig.callbackURL + '?code=mock-auth-code'
      }, 1000)
    },
    signup: (params, callback) => {
      console.log('Mock WebAuth.signup called with:', params)
      setTimeout(() => {
        // Uncomment this to simulate an error
        // callback({ description: 'Mock signup error' });

        callback(null, { email: params.email })
      }, 1000)
    },
    changePassword: (params, callback) => {
      console.log('Mock WebAuth.changePassword called with:', params)
      setTimeout(() => {
        // Uncomment this to simulate ans error
        // callback({ description: 'Mock changePassword error' });

        callback(null, { email: params.email })
      }, 1000)
    },
    authorize: (params, callback) => {
      console.log('Mock WebAuth.authorize called with:', params)
      setTimeout(() => {
        // Uncomment this to simulate an error
        // callback({ description: `Mock social login error for ${params.connection}` });

        window.location.href = mockConfig.callbackURL + '?code=mock-social-auth-code'
      }, 1000)
    },
  }

  const databaseConnection = mockConfig.extraParams.database_connection

  return { webAuth, databaseConnection }
}
