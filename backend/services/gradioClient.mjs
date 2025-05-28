import { client } from '@gradio/client';

export async function predictWithGradio(imageData) {
  const app = await client("https://chiranjeevsehgal-defect-detector.hf.space/");
  
  const result = await app.predict("/predict", [
    imageData,
  ]);
  
  return result;
}