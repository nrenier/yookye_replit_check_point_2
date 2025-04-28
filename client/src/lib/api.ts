import axios from 'axios';
import { FormValues } from "@/components/preference-form"; // Assuming FormValues is exported from preference-form.tsx

const API_URL = '/api'; // Your backend API base URL

export const submitPreferences = async (preferenceData: FormValues) => {
  try {
    const response = await axios.post(`${API_URL}/preferences`, preferenceData);
    return response.data;
  } catch (error) {
    console.error('Error submitting preferences:', error);
    throw error;
  }
};
