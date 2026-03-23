/**
 * Phase Configuration
 * Centralized phase management for the application
 * Current Date: March 17, 2026
 */

export const PHASE_CONFIG = {
  // Phase: Controls visibility of Admin and NGO login buttons
  hideAdminNGOLogin: true,
  
  // Phase: Controls visibility of visitor access button
  hideVisitorLogin: true,
  
  // Additional phase settings can be added here
  enableBetaFeatures: false,
  enableVolunteerDashboard: true,
  enableDonorDashboard: true,
};

/**
 * Get phase description
 * @returns {Object} Human-readable phase information
 */
export const getPhaseInfo = () => {
  return {
    name: 'Phase 2: Donor & Volunteer Launch',
    description: 'Public launch with Donor and Volunteer features',
    date: 'March 17, 2026',
    features: {
      donorLogin: true,
      volunteerLogin: true,
      visitorAccess: PHASE_CONFIG.hideVisitorLogin === false,
      adminLogin: PHASE_CONFIG.hideAdminNGOLogin === false,
      ngoLogin: PHASE_CONFIG.hideAdminNGOLogin === false,
    },
    settings: {
      hideAdminNGOLogin: PHASE_CONFIG.hideAdminNGOLogin,
      hideVisitorLogin: PHASE_CONFIG.hideVisitorLogin,
      enableBetaFeatures: PHASE_CONFIG.enableBetaFeatures,
      enableVolunteerDashboard: PHASE_CONFIG.enableVolunteerDashboard,
      enableDonorDashboard: PHASE_CONFIG.enableDonorDashboard,
    },
  };
};


