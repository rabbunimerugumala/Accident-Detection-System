/**
 * eyeClassifier.ts
 * In-browser eye state classifier using TensorFlow.js MobileNet transfer learning.
 * Lets you train with your own OPEN / CLOSED eye images and persists the model in IndexedDB.
 */
import * as tf from '@tensorflow/tfjs';

const MODEL_STORE_KEY = 'indexeddb://lifeguardx-eye-classifier';
const MOBILENET_URL = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_050_224/feature_vector/2/default/1';
const IMG_SIZE = 224;

let featureExtractor: tf.GraphModel | null = null;
let headModel: tf.LayersModel | null = null;

// ─── Load MobileNet feature extractor ────────────────────────────────────────
async function getFeatureExtractor(): Promise<tf.GraphModel> {
  if (featureExtractor) return featureExtractor;
  featureExtractor = await tf.loadGraphModel(MOBILENET_URL, { fromTFHub: true });
  return featureExtractor;
}

// ─── Build the small classification head ─────────────────────────────────────
function buildHead(): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [1280] }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

// ─── Extract features from a canvas / img element ────────────────────────────
async function extractFeatures(imageEl: HTMLImageElement | HTMLCanvasElement): Promise<tf.Tensor> {
  const extractor = await getFeatureExtractor();
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(imageEl)
      .resizeBilinear([IMG_SIZE, IMG_SIZE])
      .toFloat()
      .div(255)
      .expandDims(0);
    const features = extractor.predict(tensor) as tf.Tensor;
    return features.squeeze();
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Load persisted model from IndexedDB (returns false if none saved yet) */
export async function loadSavedModel(): Promise<boolean> {
  try {
    headModel = await tf.loadLayersModel(MODEL_STORE_KEY);
    console.log('[EyeClassifier] Loaded saved model from IndexedDB');
    return true;
  } catch {
    return false;
  }
}

/** 
 * Train the classifier on provided image samples.
 * @param openImages  Array of HTMLImageElement/Canvas tagged as OPEN eye
 * @param closedImages Array of HTMLImageElement/Canvas tagged as CLOSED eye
 * @param onProgress  Callback receiving epoch number and accuracy (0-1)
 */
export async function trainClassifier(
  openImages: Array<HTMLImageElement | HTMLCanvasElement>,
  closedImages: Array<HTMLImageElement | HTMLCanvasElement>,
  onProgress?: (epoch: number, acc: number, loss: number) => void
): Promise<void> {
  if (!headModel) headModel = buildHead();

  // Extract features for all images
  const allFeatures: tf.Tensor[] = [];
  const allLabels: number[] = [];

  for (const img of openImages) {
    allFeatures.push(await extractFeatures(img));
    allLabels.push(0); // 0 = OPEN
  }
  for (const img of closedImages) {
    allFeatures.push(await extractFeatures(img));
    allLabels.push(1); // 1 = CLOSED
  }

  const xs = tf.stack(allFeatures);
  const ys = tf.oneHot(tf.tensor1d(allLabels, 'int32'), 2).toFloat();

  // Dispose individual feature tensors
  allFeatures.forEach(t => t.dispose());

  await headModel.fit(xs, ys, {
    epochs: 30,
    batchSize: Math.min(8, allFeatures.length),
    shuffle: true,
    validationSplit: 0.15,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        onProgress?.(epoch + 1, logs?.acc ?? 0, logs?.loss ?? 0);
      },
    },
  });

  xs.dispose();
  ys.dispose();

  // Save to IndexedDB
  await headModel.save(MODEL_STORE_KEY);
  console.log('[EyeClassifier] Model trained and saved.');
}

/** 
 * Predict eye state from an image.
 * Returns { open: number, closed: number } probabilities, or null if no model loaded.
 */
export async function predictEyeState(
  imageEl: HTMLImageElement | HTMLCanvasElement
): Promise<{ open: number; closed: number } | null> {
  if (!headModel) {
    const loaded = await loadSavedModel();
    if (!loaded) return null;
  }

  const features = await extractFeatures(imageEl);
  const prediction = headModel!.predict(features.expandDims(0)) as tf.Tensor;
  const [openProb, closedProb] = Array.from(await prediction.data());
  features.dispose();
  prediction.dispose();

  return { open: openProb, closed: closedProb };
}

/** Delete the saved model from IndexedDB */
export async function deleteSavedModel(): Promise<void> {
  await tf.io.removeModel(MODEL_STORE_KEY);
  headModel = null;
  console.log('[EyeClassifier] Saved model deleted.');
}

/** Check if a trained model exists in IndexedDB */
export async function hasSavedModel(): Promise<boolean> {
  const models = await tf.io.listModels();
  return MODEL_STORE_KEY in models;
}
