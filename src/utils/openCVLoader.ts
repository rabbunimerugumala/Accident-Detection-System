/**
 * openCVLoader.ts
 * Utility to track OpenCV.js initialization state.
 * Prevents calling cv functions before the WASM/JS bundle is fully loaded.
 */

declare global {
  interface Window {
    cv: any;
  }
}

let cvPromise: Promise<any> | null = null;

/**
 * Returns a promise that resolves when OpenCV.js is fully initialized and ready to use.
 */
export const waitForOpenCV = (): Promise<any> => {
  if (cvPromise) return cvPromise;

  cvPromise = new Promise((resolve) => {
    // If already loaded by the script tag
    if (window.cv && window.cv.onRuntimeInitialized === undefined) {
      resolve(window.cv);
      return;
    }

    if (window.cv) {
      window.cv.onRuntimeInitialized = () => {
        console.log('[OpenCV] Runtime Initialized');
        resolve(window.cv);
      };
    } else {
      // Check every 100ms if cv is attached to window
      const checkInterval = setInterval(() => {
        if (window.cv) {
          clearInterval(checkInterval);
          window.cv.onRuntimeInitialized = () => {
            console.log('[OpenCV] Runtime Initialized (Delayed)');
            resolve(window.cv);
          };
          // In some versions it might already be initialized by the time we check
          if (window.cv.Mat) {
             resolve(window.cv);
          }
        }
      }, 100);
    }
  });

  return cvPromise;
};

/**
 * Synchronous check to see if OpenCV is ready.
 */
export const isOpenCVReady = (): boolean => {
  return !!(window.cv && window.cv.Mat);
};
