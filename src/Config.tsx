
 const config = {
    state: process.env.STATE || '12345678',
    redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000',
    clientId: process.env.CLIENT_ID || '',
    scope: process.env.SCOPE || 'openid fhirUser launch user/Patient.read user/Observation.read user/Observation.write'
 }

 export default config;
