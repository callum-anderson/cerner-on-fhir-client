import './App.css';
import './services/CernerFhirClient';
import Container from 'react-bootstrap/Container';
import { Route, Routes, useSearchParams } from "react-router-dom";
import Header from "./Header";
import { useState } from 'react';
import CernerFhirClient from './services/CernerFhirClient';
import GetResults from './GetResults';
import config from './Config';
import { Bundle, Observation, Patient } from 'fhir/r4';
import PostTemperature from './PostTemperature';
import GenerateTemperatureResource from './helpers/GenerateObservationResource';

// TODO: implement State check
// TODO: implement token refresh mechanism
// TODO: implement signout/token revocation

function App() {

  const TOKEN_ENDPOINT = 'TOKEN_ENDPOINT';
  const AUTHORIZATION_ENDPOINT = 'AUTHORIZATION_ENDPOINT';
  const FHIR_ENDPOINT = 'FHIR_ENDPOINT';

  type TokenData = {access_token: string, id_token: string, patient: string, need_patient_banner: boolean};

  const { scope, state, redirectUri, clientId } = config;

  const [searchParams] = useSearchParams();

  const [ tokenData, setTokenData ] = useState<TokenData | null>();
  const [ errorMessage, setErrorMessage ] = useState<string | null>();

  const [ patientData, setPatientData ] = useState<Patient | null>();
  const [ observationsBundle, setObservationsBundle ] = useState<Bundle<Observation> | null>();

  const iss = searchParams.get('iss');
  const launch = searchParams.get('launch');
  const code = searchParams.get('code');

  let authorization_endpoint: string = window.localStorage.getItem(AUTHORIZATION_ENDPOINT) || '';
  let token_endpoint: string = window.localStorage.getItem(TOKEN_ENDPOINT) || '';
  let fhir_endpoint: string = window.localStorage.getItem(FHIR_ENDPOINT) || '';

  let cernerFhirClient: CernerFhirClient | null = null;

  if ((!iss || !launch) && !code) console.error(`Error: either 'code', or 'iss' and 'launch' query parameters are required. Supplied: iss='${iss}', launch='${launch}' code='${code}'`);

  const makeSmartConfigDiscoveryRequest = async (iss: string) => {
    try {
      const smartConfigResponse = await fetch(`${iss}/.well-known/smart-configuration`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!smartConfigResponse.ok) throw Error(`Error making discovery request to '${iss}/.well-known/smart-configuration'. ${smartConfigResponse.statusText}`);
      const smartConfigResponseData = await smartConfigResponse.json();

      window.localStorage.setItem(AUTHORIZATION_ENDPOINT, smartConfigResponseData.authorization_endpoint);
      window.localStorage.setItem(TOKEN_ENDPOINT, smartConfigResponseData.token_endpoint);

      authorization_endpoint = smartConfigResponseData.authorization_endpoint;
      token_endpoint = smartConfigResponseData.token_endpoint;
    } catch (error) {
      setErrorMessage('An authentication error occurred - please try re-launching the app.');
      console.error(error);
    }
  }

  const generateAuthUrl = (authUrl: string, iss: string, launch: string) => {
    const authEndpoint = new URL(authUrl);
    authEndpoint.searchParams.append('client_id', clientId);
    authEndpoint.searchParams.append('scope', scope);
    authEndpoint.searchParams.append('redirect_uri', redirectUri);
    authEndpoint.searchParams.append('response_type', 'code');
    authEndpoint.searchParams.append('aud', iss);
    authEndpoint.searchParams.append('launch', launch);

    return authEndpoint.href;
  }

  const makeTokenRequest = async (code: string) => {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('client_id', clientId);
    formData.append('redirect_uri', redirectUri);

    const response = await fetch(token_endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) throw Error('Error fetching token. ' + response.statusText);
    const responseData = await response.text();

    return responseData;
  }

  const initiateLaunchProcess = async () => {
    if (!tokenData) {
      console.debug('No token data, attempting token request...');
      if (code && token_endpoint) {
        try {
          console.debug('Making token request...');
          const tokenResponse = await makeTokenRequest(code);

          setTokenData(JSON.parse(tokenResponse as string));
        } catch (error) {
          console.error(`Error making token request: ${error}`);
          setErrorMessage(`Error making token request: ${error}`);
        }
      } else {
        if (iss && launch) {
          console.debug('Starting launch process...');
          window.localStorage.setItem(FHIR_ENDPOINT, iss);
          if (!authorization_endpoint || !token_endpoint) await makeSmartConfigDiscoveryRequest(iss);
          const authEndpoint = generateAuthUrl(authorization_endpoint, iss, launch);
          window.location.assign(authEndpoint);
        } else {
          console.error('No token or launch parameters. Please try closing and re-launching the app.');
          setErrorMessage('An authentication error occurred - please try re-launching the app.');
        }
      }
    }
  }

  const fetchPatientDetails = async () => {
    if (!tokenData || !tokenData.patient) {
      setErrorMessage('An authentication error occurred - please try re-launching the app.');
      return;
    }
    cernerFhirClient = cernerFhirClient ? cernerFhirClient : new CernerFhirClient(fhir_endpoint);
    const response = await cernerFhirClient.getResourceById('Patient', tokenData?.patient as string, tokenData?.access_token as string);
    if (response.status !== 200) {
      console.error(response.statusText);
      setErrorMessage('An authentication error occurred - please try re-launching the app.');
    } else {
      const patientDetails = await response.json();
      setPatientData(patientDetails);
    }
  }

  const fetchVitalSigns = async () => {
    if (!tokenData || !tokenData.patient) {
      setErrorMessage('An authentication error occurred - please try re-launching the app.');
      return;
    }
    cernerFhirClient = cernerFhirClient ? cernerFhirClient : new CernerFhirClient(fhir_endpoint);
    const queryParams = new URLSearchParams({
      patient: tokenData!.patient,
      category: 'vital-signs'
    });
    const response = await cernerFhirClient.searchResourceWithQueryParams('Observation', queryParams, tokenData!.access_token)
    if (response.status !== 200) {
      console.error(response.statusText);
      setErrorMessage('An authentication error occurred - please try re-launching the app.');
    } else {
      const observationsBundle = await response.json();
      setObservationsBundle(observationsBundle);
    }
  }

  const postTemperature = async (temperature: number): Promise<boolean> => {
    if (!tokenData || !tokenData.patient) {
      setErrorMessage('An authentication error occurred - please try re-launching the app.');
      return false;
    }
    cernerFhirClient = cernerFhirClient ? cernerFhirClient : new CernerFhirClient(fhir_endpoint);

    const temperatureResource = GenerateTemperatureResource(tokenData.patient, temperature);

    console.log(temperatureResource);

    const response = await cernerFhirClient.postResource('Observation', temperatureResource, tokenData.access_token);
    if (response.status !== 201) {
      setErrorMessage('An authentication error occurred - please try re-launching the app.');
      return false;
    } else {
      return true;
    }
  }

  if (tokenData && fhir_endpoint && !patientData) {
    if (tokenData.need_patient_banner){
      console.debug('Fetching patient details...');
      fetchPatientDetails();
    }
  } else if ((iss && launch) || code) {
    initiateLaunchProcess();
  }

  return (
    <div className='App'>
      <Header patientData={patientData || undefined} fetchVitalSigns={fetchVitalSigns} setTokenData={setTokenData}/>
      <Container>
          <Routes>
            <Route path='/get-vital-signs' element={<GetResults observationsBundle={observationsBundle ?? null} errorMessage={errorMessage ?? ''} />} />
            <Route path='/post-temperature' element={<PostTemperature postTemperature={postTemperature} fetchVitalSigns={fetchVitalSigns} errorMessage={errorMessage ?? ''} />} />
          </Routes>
      </Container>
    </div>
  );
}

export default App;
