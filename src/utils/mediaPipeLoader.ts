import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | null = null;
let isLoading = false;

export const loadMediaPipeModels = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) return faceLandmarker;
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (faceLandmarker) return faceLandmarker;
  }

  isLoading = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "IMAGE",
      numFaces: 1
    });
    
    console.log("MediaPipe Face Landmarker loaded successfully");
    return faceLandmarker;
  } catch (error) {
    console.error("Error loading MediaPipe models:", error);
    throw error;
  } finally {
    isLoading = false;
  }
};
