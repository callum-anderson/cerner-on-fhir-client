import { useState } from "react";
import Loader from "./Loader";
import { Bundle, BundleEntry, Observation } from 'fhir/r4';
import { Alert, Col, Form, Row } from "react-bootstrap";

const GetResults = ({observationsBundle, errorMessage}: {observationsBundle: Bundle<Observation> | null, errorMessage: string}) => {

  const [ filterField, setFilterField ] = useState('');

  const now = new Date();

  const mapResultValue = (result: Observation): string => {
    if (typeof result.valueCodeableConcept !== 'undefined') return result.valueCodeableConcept.text ?? '';

    if (typeof result.valueString !== 'undefined') return result.valueString ?? '';

    if (result.code.text?.toLowerCase() === 'blood pressure') {
      return result.component ? result.component.map(
          component => component.valueQuantity ? `${component.code?.text}: ${component.valueQuantity?.value} ${component.valueQuantity?.unit}` 
            : component.dataAbsentReason ? `Data absent reason: ${component.dataAbsentReason.text}` 
              : ''
        ).join('\n')
      : '';
    }

    return result.valueQuantity ? `${result.valueQuantity.value ?? ''} ${result.valueQuantity.unit ?? ''}` : ''
    }

  const handleSortFilter = (event: any) => {
    setFilterField(event.target.value);
  }

  const isValidDate = (date: Date | undefined): boolean => {
    if (!date) return true; // no need to warn on missing date field
    return date < now;
  }

  const formatDate = (date: Date): string => {
    const today = new Date();
    if (today.toDateString() === date.toDateString()) {
      const timeString = date.toTimeString();
      return `Today ${timeString.substring(0,timeString.indexOf(' '))}`;
    } else {
      return date.toLocaleDateString();
    }
  }

return (
    <div>
        {observationsBundle && 
        <div>
            <div className='heading'>
              <h4 className='my-5'>Vital Signs</h4>
            </div>
            <Row className='my-4 align-items-center justify-content-md-center'>
              <Col sm={3}>
                <strong>Filter</strong>
              </Col>
              <Col sm={5}>
                <Form.Select aria-label='Sort filter' onChange={handleSortFilter}>
                  <option value=''></option>
                  {
                    Array.from(new Set(observationsBundle?.entry?.map((x: BundleEntry) => (x.resource as Observation)?.code.text))).map(y => {
                      return (<option key={y} value={y}>{y}</option>)
                    })
                  }
                </Form.Select>
              </Col>
            </Row>
            <table className='table'>
                <thead>
                    <tr>
                    <th>Description</th>
                    <th>Value</th>
                    <th>Date</th>
                    <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                  {observationsBundle?.entry?.filter((x: BundleEntry) => {
                    if (!filterField) return true;
                    return ((x.resource as Observation).code.text === filterField);
                  })
                    .map((bundleEntry: BundleEntry, i) => {
                    const effectiveDateTime = (bundleEntry.resource as Observation).effectiveDateTime ? new Date((bundleEntry.resource as Observation).effectiveDateTime!) : undefined;
                    const validDate = isValidDate(effectiveDateTime);
                    return (
                      <tr key={(bundleEntry.resource as Observation).id}>
                        <td>{(bundleEntry.resource as Observation).code?.text}</td>
                        <td className="pre-wrap">{mapResultValue(bundleEntry.resource as Observation)}</td>
                        <td className={validDate ? '' : 'text-danger'}>
                          {effectiveDateTime ? formatDate(effectiveDateTime) : ''}
                          {!validDate && <span><strong> ! </strong></span>}
                        </td>
                        <td>{(bundleEntry.resource as Observation).status || 'unknown'}</td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
        </div>
        }
        {(!observationsBundle && !errorMessage) && <Loader />}
        {errorMessage && 
            <Alert variant='danger' className='p-2 my-5'>
              <Alert.Heading>Error</Alert.Heading>
              <p>{errorMessage}</p>
            </Alert>}
    </div>
)
};

export default GetResults;
