import 'dotenv/config';
import { client } from '@gradio/client';

const CUSTOM_URL = process.env.CUSTOM_MODEL_URL

export async function predictWithGradio(imageData) {
  const app = await client(CUSTOM_URL);
  
  const result = await app.predict("/predict", [
    imageData,
  ]);
  
  return result;
}