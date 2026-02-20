import { ref, update } from "firebase/database";
import { db } from "./firebase";

/**
 * Updates the accident state in Firebase.
 * Used for ESP simulation and testing ONLY.
 * 
 * @param {Object} data - The data fields to merge into the /accidents node.
 */
export async function updateAccidentState(data) {
  const r = ref(db, "accidents");
  return update(r, data);
}
