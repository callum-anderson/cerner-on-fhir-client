import { Patient } from 'fhir/r4';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Header({patientData, fetchVitalSigns, setTokenData}: {patientData: Patient | undefined, fetchVitalSigns: Function, setTokenData: Function}) {

  return (
    <div>
      <nav className='navbar navbar-expand-sm navbar-dark bg-dark'>
        <Container>
          <Link to='/' className='navbar-brand'>
            <span className="navbar-text">Cerner on FHIR Client</span>
          </Link>
          <button
            className='navbar-toggler'
            type='button'
            data-bs-toggle='collapse'
            data-bs-target='#mynavbar'
          >
            <span className='navbar-toggler-icon'></span>
          </button>
          <div className='collapse navbar-collapse' id='mynavbar'>
            <ul className='navbar-nav ms-auto'>
              <li className='nav-item'>
                <Link className='nav-link' to='/get-vital-signs/' onClick={() => {
                  try {
                    fetchVitalSigns();
                  } catch (error) {
                    console.error(error);
                    setTokenData(null);
                  }
                }}>
                  Vital Signs
                </Link>
              </li>
              <li className='nav-item'>
                <Link className='nav-link' to='/post-temperature/'>
                  Upload Temperature Reading
                </Link>
              </li>
            </ul>
          </div>
        </Container>
      </nav>
      { patientData && 
        <div className='bg-light py-2 border-bottom border-dark'>
            <span className='mx-5'>{patientData.name?.at(0)?.family || '[UNKNOWN]'}, {patientData.name?.at(0)?.given?.join(' ') || '[UNKNOWN]'}</span>
            <span className='mx-5'>{patientData.gender? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1) : ''}</span>
            <span className='mx-5'>{patientData.birthDate ? new Date(patientData.birthDate).toLocaleDateString() : ''}</span>
            <span className='mx-5'>{patientData.telecom?.filter((x: any) => x.system === 'phone')?.at(0)?.value}</span>
        </div>
        }
    </div>
  );
}
