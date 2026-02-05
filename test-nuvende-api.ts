import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testAuth() {
    console.log('Testing Nuvende API Auth...');
    console.log('URL:', process.env.NUVENDE_API_URL);
    console.log('Client ID:', process.env.NUVENDE_CLIENT_ID);

    try {
        const baseUrl = process.env.NUVENDE_API_URL || '';
        const authBase = baseUrl.replace(/\/v1\/?$/, ''); 
        const tokenUrl = `${authBase}/oauth/token`;
        
        console.log('POSTing to:', tokenUrl);

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.NUVENDE_CLIENT_ID || '');
        params.append('client_secret', process.env.NUVENDE_CLIENT_SECRET || '');
        params.append('scope', process.env.NUVENDE_SCOPES || '');

        const response = await axios.post(tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('✅ Auth Success!');
        console.log('Token:', response.data.access_token?.substring(0, 10) + '...');
    } catch (error: any) {
        console.error('❌ Auth Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAuth();