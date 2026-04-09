export const FEATURE_FLAGS = {
  FEATURES: {
    WEEKLY_CHECKIN: true,    
    DASHBOARD: true,            
    NOTIFICATIONS: true,
    PROFILE: false,        
    
    // Disable all other features
    MESSAGES: false,         
    CONSULTANTS: false,      
    PAYMENTS: false,           
    WORKOUTS: false,         
    MEAL_PLANNING: false,       
    PROGRESS_TRACKING: false,   
    SCHEDULING: false,          
    SETTINGS: false,         
    REPORTS: false,             
  }
};

export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS.FEATURES): boolean => {
  return FEATURE_FLAGS.FEATURES[feature];
};