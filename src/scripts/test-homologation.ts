import dotenv from 'dotenv';
dotenv.config();

import { NuvendeProvider } from '../providers/NuvendeProvider';

async function main() {
  console.log('--- Starting Homologation Test ---');
  console.log('API URL:', process.env.NUVENDE_API_URL);
  console.log('Client ID Present:', !!process.env.NUVENDE_CLIENT_ID);

  const provider = new NuvendeProvider();

  try {
    console.log('\n1. Testing Authentication & Create Pix Charge...');
    // Test with 10.00 BRL
    const charge = await provider.createPixCharge('test_user_homolog', 10.00);
    console.log('✅ Success! Charge Created:');
    console.log(JSON.stringify(charge, null, 2));
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.error(error);
    }
  }
}

main();
