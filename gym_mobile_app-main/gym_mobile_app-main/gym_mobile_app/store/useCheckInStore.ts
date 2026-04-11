import { create } from 'zustand';
import { checkInApi, type CheckInQuestion, type CheckInDomain } from '../services/checkInApi';

interface CheckInState {
  // Questions and Domains
  domains: CheckInDomain[];
  questions: CheckInQuestion[];
  isLoadingQuestions: boolean;
  questionsError: string | null;

  // Form State
  formAnswers: Record<string, any>;
  filledDomains: string[];
  currentDomainIndex: number;

  // Submission
  isSubmitting: boolean;
  submitError: string | null;
  lastSubmitDate: string | null;

  // Reminders
  needsCheckIn: boolean;
  missingDomains: string[];
  daysOverdue: number;

  // Actions
  loadQuestions: () => Promise<void>;
  setFormAnswer: (field: string, value: any) => void;
  setFormAnswers: (answers: Record<string, any>) => void;
  markDomainFilled: (domainId: string) => void;
  submitCheckIn: (userId: string) => Promise<boolean>;
  loadCheckInStatus: (userId: string) => Promise<void>;
  loadReminders: (userId: string) => Promise<void>;
  resetForm: () => void;
  setCurrentDomainIndex: (index: number) => void;
}

export const useCheckInStore = create<CheckInState>((set, get) => ({
  // Initial State
  domains: [],
  questions: [],
  isLoadingQuestions: false,
  questionsError: null,

  formAnswers: {},
  filledDomains: [],
  currentDomainIndex: 0,

  isSubmitting: false,
  submitError: null,
  lastSubmitDate: null,

  needsCheckIn: true,
  missingDomains: [],
  daysOverdue: 0,

  // Load Questions from backend
  loadQuestions: async () => {
    set({ isLoadingQuestions: true, questionsError: null });
    try {
      const questionsData = await checkInApi.getCheckInQuestions();
      const allQuestions = questionsData.flatMap((domain: any) => domain.questions || []);
      set({
        domains: questionsData,
        questions: allQuestions,
        isLoadingQuestions: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load questions';
      set({ questionsError: message, isLoadingQuestions: false });
    }
  },

  // Set Single Answer
  setFormAnswer: (field: string, value: any) => {
    set((state) => ({
      formAnswers: { ...state.formAnswers, [field]: value },
    }));
  },

  // Set Multiple Answers
  setFormAnswers: (answers: Record<string, any>) => {
    set((state) => ({
      formAnswers: { ...state.formAnswers, ...answers },
    }));
  },

  // Mark a domain as filled
  markDomainFilled: (domainId: string) => {
    set((state) => {
      const alreadyFilled = state.filledDomains.includes(domainId);
      return {
        filledDomains: alreadyFilled
          ? state.filledDomains
          : [...state.filledDomains, domainId],
      };
    });
  },

  // Submit Check-In to backend
  submitCheckIn: async (userId: string) => {
    set({ isSubmitting: true, submitError: null });
    try {
      const { formAnswers } = get();
      await checkInApi.submitCheckIn(userId, formAnswers);
      set({
        isSubmitting: false,
        lastSubmitDate: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit check-in';
      set({ submitError: message, isSubmitting: false });
      return false;
    }
  },

  loadCheckInStatus: async (userId: string) => {
    console.log('Check-in status available after submission:', userId);
  },

  loadReminders: async (userId: string) => {
    console.log('Reminders managed by notification system:', userId);
  },

  // Reset Form
  resetForm: () => {
    set({
      formAnswers: {},
      filledDomains: [],
      currentDomainIndex: 0,
      submitError: null,
    });
  },

  setCurrentDomainIndex: (index: number) => {
    set({ currentDomainIndex: index });
  },
}));
