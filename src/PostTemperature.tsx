import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";
import { Alert, Button, Col, Form, FormGroup, Row } from "react-bootstrap";

const PostTemperature = ({postTemperature, errorMessage, fetchVitalSigns}: {postTemperature: Function, errorMessage: string, fetchVitalSigns: Function}) => {

  const navigate = useNavigate();

  const [ isLoading, setIsLoading ] = useState(false);

  const [ temperatureReading, setTemperatureReading ] = useState({ temperature: 0 });

  const handleInput = (event: any) => {
    event.preventDefault();
    const { name, value } = event.target;

    setTemperatureReading({ ...temperatureReading, [name]: value });
  }

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    try {
        setIsLoading(true);

        const response = await postTemperature(temperatureReading.temperature);

        if (response) {
          try {
            await fetchVitalSigns();
            navigate('/get-vital-signs');
          } catch (error) {
            console.error(error);
          }
        }
    } catch (error) {
        console.error(error);
    } finally{
        setIsLoading(false);
    }
  }

return (
    <div className='Patient-form'>
      <div className='heading'>
          <h4 className="my-5">Upload Temperature Reading</h4>
      </div>
      <p className="my-5">Please submit a temperature reading (in degrees celsius).</p>
      <Form className="mt-5" onSubmit={handleSubmit}>
      <Form.Group as={Row} className="mb-3 justify-content-md-center" controlId="formTemperature">
          <Form.Label column sm={3} className="my-3">Temperature (°C):</Form.Label>
          <Col sm={2} className="my-3">
              <Form.Control type="number" name="temperature" min="25" max="55" step=".1" width="50" 
                disabled={errorMessage.length>0 || isLoading} required onChange={handleInput} />
          </Col>
      </Form.Group>
      <FormGroup role="form" className="my-5">
          <Button className="btn btn-primary btn-large centerButton" type="submit" disabled={errorMessage.length>0 || isLoading}>Upload</Button>
      </FormGroup>
    </Form>
    {isLoading && <Loader />}
    {errorMessage && 
            <Alert variant='danger' className='p-2 my-5'>
              <Alert.Heading>Error</Alert.Heading>
              <p>{errorMessage}</p>
            </Alert>}
  </div>
)
};

export default PostTemperature;
