import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://hiwox.dedyn.io/api';

interface CheckInQuestion {
  id: string;
  label: string;
  type: 'scale' | 'number' | 'dropdown' | 'yesno';
  min?: number;
  max?: number;
  options?: string[];
  lowLabel?: string;
  highLabel?: string;
  unit?: string;
  optional?: boolean;
  invertedScore?: boolean;
}

interface CheckInDomain {
  id?: string;
  domainId?: string;
  label: string;
  icon?: string;
  color?: string;
  gradientColors?: [string, string];
  questions: CheckInQuestion[];
}

interface CheckInAnswer {
  questionId: string;
  value: number | string;
}

interface CheckInResponse {
  userId: string;
  answers: CheckInAnswer[];
  note?: string;
}

class CheckInApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // REQUEST INTERCEPTOR — attach Bearer token
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('userToken');
      console.log('TOKEN USED:', token);
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      } else {
        console.warn('No token found in AsyncStorage');
      }
      return config;
    });

    // RESPONSE INTERCEPTOR — log errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('API Error:', error.response.status);
          console.error(JSON.stringify(error.response.data, null, 2));
        } else {
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // FETCH QUESTIONS from backend
  async getCheckInQuestions(): Promise<CheckInDomain[]> {
    try {
      const response = await this.api.get('/checkin/questions', {
        params: { target: 'coordinator' },
      });
      console.log('Questions API response:', response.data);
      return response.data.domains || [];
    } catch (error) {
      console.error('Error fetching check-in questions:', error);
      throw error;
    }
  }

  // SUBMIT CHECK-IN to backend
  async submitCheckIn(
    userId: string,
    answers: Record<string, number | string | null>,
    note?: string
  ): Promise<any> {
    try {
      const answersArray = Object.entries(answers)
        .filter(([_, value]) =>
          value !== null &&
          value !== undefined &&
          value !== '' &&
          value !== 'NaN'
        )
        .map(([questionId, value]) => ({
          questionId,
          value: value,
        }));

      const payload = {
        userId,
        answers: answersArray,
        note,
      };

      console.log('CLEAN PAYLOAD:', JSON.stringify(payload, null, 2));
      return await this.api.post('/checkin/submit', payload);
    } catch (error) {
      console.error('Error submitting check-in:', error);
      throw error;
    }
  }

  async getCheckInReminders() {
    return { needsCheckIn: true, missingDomains: [] };
  }

  async getUserCheckInStatus() {
    return { completedDomains: [], lastCheckInDate: null };
  }
}

export const checkInApi = new CheckInApiService();
export type { CheckInQuestion, CheckInDomain, CheckInAnswer, CheckInResponse };
