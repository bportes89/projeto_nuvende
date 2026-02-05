import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.NUVENDE_CLIENT_ID;
const clientSecret = process.env.NUVENDE_CLIENT_SECRET;
const scopes = process.env.NUVENDE_SCOPES;
const baseUrl = process.env.NUVENDE_API_URL || 'https://api.nuvende.com.br/v1';

console.log('--- Debugging Nuvende Auth ---');
console.log('Client ID:', clientId ? 'Set' : 'Missing');
console.log('Client Secret:', clientSecret ? 'Set' : 'Missing');
console.log('Scopes:', scopes);
console.log('Base URL:', baseUrl);

async function tryAuth(url: string) {
    console.log(`\nTrying URL: ${url}`);
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId || '');
        params.append('client_secret', clientSecret || '');
        params.append('scope', scopes || '');

        const response = await axios.post(url, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('SUCCESS!');
        console.log('Token:', response.data.access_token ? 'Received' : 'Missing');
        console.log('Expires In:', response.data.expires_in);
    } catch (error: any) {
        console.log('FAILED');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        // console.log('Full Error:', error.message);
    }
}

async function run() {
    const authBase = baseUrl.replace(/\/v1\/?$/, '');
    
    // Attempt 1: Root /oauth/token
    await tryAuth(`${authBase}/oauth/token`);

    // Attempt 2: Versioned /v1/oauth/token
    await tryAuth(`${authBase}/v1/oauth/token`);

    // Attempt 4: /oauth2/token
    await tryAuth(`${authBase}/oauth2/token`);

    // Attempt 5: /auth/token
    await tryAuth(`${authBase}/auth/token`);
    
    // Attempt 6: Sandbox/Homolog URLs
    await tryAuth(`https://sandbox.nuvende.com.br/oauth/token`);
    await tryAuth(`https://homolog.nuvende.com.br/oauth/token`);
    await tryAuth(`https://hml.nuvende.com.br/oauth/token`);
}

run();
