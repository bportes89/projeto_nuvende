import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3001/api';

async function testAdminLogin() {
    console.log('--- Testing Admin Login ---');
    
    const email = 'admin@nuvende.com';
    const password = 'admin';
    const name = 'Admin Test';

    try {
        console.log(`Attempting to login with ${email}...`);
        const response = await axios.post(`${API_URL}/users`, {
            email,
            name,
            password
        });

        console.log('Login Response:', response.status);
        console.log('User ID:', response.data.id);
        console.log('Role:', response.data.role);

        if (response.data.role === 'ADMIN') {
            console.log('SUCCESS: Admin login verified.');
        } else {
            console.log('FAILURE: User logged in but role is not ADMIN.');
        }

    } catch (error: any) {
        console.log('Login Failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else if (error.request) {
            console.log('No response received:', error.request);
        } else {
            console.log('Error Message:', error.message);
        }
        console.log('Error Config:', error.config);
    }
}

async function testWrongPassword() {
    console.log('\n--- Testing Wrong Password ---');
    const email = 'admin@nuvende.com';
    const password = 'wrongpassword';
    const name = 'Admin Test';

    try {
        await axios.post(`${API_URL}/users`, { email, name, password });
        console.log('FAILURE: Should have rejected wrong password.');
    } catch (error: any) {
        if (error.response && error.response.status === 401) {
            console.log('SUCCESS: Rejected with 401 as expected.');
        } else {
            console.log('FAILURE: Unexpected error:', error.message);
        }
    }
}

async function run() {
    await testAdminLogin();
    await testWrongPassword();
}

run();
