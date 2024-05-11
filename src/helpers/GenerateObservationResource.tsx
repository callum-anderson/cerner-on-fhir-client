import { Observation } from 'fhir/r4';

const GenerateTemperatureResource = (patientId: string, temperature: number): Observation => {

  return {
      resourceType : "Observation",
      status : "final",
      category : [{
        coding : [{
          system : "http://terminology.hl7.org/CodeSystem/observation-category",
          code : "vital-signs",
          display : "Vital Signs"
        }],
        text : "Vital Signs"
      }],
      code : {
        coding : [
          {
              system : "http://loinc.org",
              code : "8331-1",
              display : "Body temperature"
          }
        ],
        text : "Temperature Oral"
      },
      subject : {
        reference : `Patient/${patientId}`
      },
      effectiveDateTime : new Date().toISOString(),
      valueQuantity : {
        value : Number(temperature),
        unit : "C",
        system : "http://unitsofmeasure.org",
        code : "Cel"
      }
    }
}

export default GenerateTemperatureResource;