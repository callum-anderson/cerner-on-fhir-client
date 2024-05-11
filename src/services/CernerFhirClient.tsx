
class CernerFhirClient {

    baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || 'localhost:8080/fhir';
    }

    async getResourceById<T>(resourceType: T, id: string, accessToken: string): Promise<Response> {

        return fetch(`${this.baseUrl}/${resourceType}/${id}`, {
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            })
        });
    }

    async searchResourceWithQueryParams<T>(resourceType: T, queryParams: URLSearchParams, accessToken: string): Promise<Response> {

        return fetch(`${this.baseUrl}/${resourceType}?${queryParams}`, {
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            })
        });
    }

    async postResource<FhirResource>(resourceType: FhirResource, resource: any, accessToken: string): Promise<Response> {

        return fetch(`${this.baseUrl}/${resourceType}`, {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json+fhir',
                'Accept': 'application/json'
            }),
            body: JSON.stringify(resource)
        });
    }
}

export default CernerFhirClient;
