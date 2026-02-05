
import axios from 'axios';

async function testLogin() {
    try {
        console.log('Attempting login as admin...');
        const response = await axios.post('http://localhost:3000/api/users', {
            email: 'admin@nuvende.com',
            name: 'Bruno',
            password: 'admin'
        });
        console.log('✅ Login success:', response.data);
    } catch (error: any) {
        console.error('❌ Login failed:', error.response?.data || error.message);
    }
}

testLogin();
