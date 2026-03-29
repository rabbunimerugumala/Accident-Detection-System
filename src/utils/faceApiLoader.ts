import * as faceapi from 'face-api.js';

let isModelLoaded = false;

export const loadFaceApiModels = async (): Promise<void> => {
  if (isModelLoaded) return;

  try {
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    isModelLoaded = true;
    console.log('Face API models loaded successfully');
  } catch (error) {
    console.error('Error loading Face API models:', error);
    throw error;
  }
};
