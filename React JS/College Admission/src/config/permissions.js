// Central permissions configuration

export const PERMISSIONS = {
  // Student
  STUDENT_VIEW: 'STUDENT_VIEW',
  STUDENT_CREATE: 'STUDENT_CREATE',
  STUDENT_EDIT: 'STUDENT_EDIT',
  STUDENT_DELETE: 'STUDENT_DELETE',

  // Application
  APPLICATION_VIEW: 'APPLICATION_VIEW',
  APPLICATION_CREATE: 'APPLICATION_CREATE',
  APPLICATION_EDIT: 'APPLICATION_EDIT',
  APPLICATION_DELETE: 'APPLICATION_DELETE',
  APPLICATION_APPROVE: 'APPLICATION_APPROVE',

  // College
  COLLEGE_VIEW: 'COLLEGE_VIEW',
  COLLEGE_CREATE: 'COLLEGE_CREATE',
  COLLEGE_EDIT: 'COLLEGE_EDIT',
  COLLEGE_DELETE: 'COLLEGE_DELETE',

  // Department
  DEPARTMENT_VIEW: 'DEPARTMENT_VIEW',
  DEPARTMENT_CREATE: 'DEPARTMENT_CREATE',
  DEPARTMENT_EDIT: 'DEPARTMENT_EDIT',
  DEPARTMENT_DELETE: 'DEPARTMENT_DELETE',

  // Course
  COURSE_VIEW: 'COURSE_VIEW',
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_EDIT: 'COURSE_EDIT',
  COURSE_DELETE: 'COURSE_DELETE',

  // Payment
  PAYMENT_VIEW: 'PAYMENT_VIEW',
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  PAYMENT_DELETE: 'PAYMENT_DELETE',

  // Notification
  NOTIFICATION_VIEW: 'NOTIFICATION_VIEW',
  NOTIFICATION_CREATE: 'NOTIFICATION_CREATE',
  NOTIFICATION_DELETE: 'NOTIFICATION_DELETE',

  // Document
  DOCUMENT_VIEW: 'DOCUMENT_VIEW',
  DOCUMENT_CREATE: 'DOCUMENT_CREATE',
  DOCUMENT_DELETE: 'DOCUMENT_DELETE',

  // Officer
  OFFICER_VIEW: 'OFFICER_VIEW',
  OFFICER_CREATE: 'OFFICER_CREATE',
  OFFICER_EDIT: 'OFFICER_EDIT',
  OFFICER_DELETE: 'OFFICER_DELETE',

  // Record
  RECORD_VIEW: 'RECORD_VIEW',
  RECORD_CREATE: 'RECORD_CREATE',
  RECORD_DELETE: 'RECORD_DELETE',

  // Dashboard
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  DASHBOARD_STATS: 'DASHBOARD_STATS',

  // User Management
  USER_MANAGE: 'USER_MANAGE',
  ROLE_MANAGE: 'ROLE_MANAGE',
};

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  OFFICER: 'OFFICER',
  STUDENT: 'STUDENT',
  VIEWER: 'VIEWER',
};

// Sidebar menu with permission requirements
export const MENU_CONFIG = [
  {
    section: 'Main',
    items: [
      {
        path: '/',
        label: 'Dashboard',
        icon: 'FiHome',
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
    ],
  },
  {
    section: 'Management',
    items: [
      {
        path: '/students',
        label: 'Students',
        icon: 'FiUsers',
        permission: PERMISSIONS.STUDENT_VIEW,
      },
      {
        path: '/applications',
        label: 'Applications',
        icon: 'FiFileText',
        permission: PERMISSIONS.APPLICATION_VIEW,
      },
      {
        path: '/colleges',
        label: 'Colleges',
        icon: 'FiMapPin',
        permission: PERMISSIONS.COLLEGE_VIEW,
      },
      {
        path: '/departments',
        label: 'Departments',
        icon: 'FiGrid',
        permission: PERMISSIONS.DEPARTMENT_VIEW,
      },
      {
        path: '/courses',
        label: 'Courses',
        icon: 'FiBook',
        permission: PERMISSIONS.COURSE_VIEW,
      },
    ],
  },
  {
    section: 'Operations',
    items: [
      {
        path: '/payments',
        label: 'Payments',
        icon: 'FiCreditCard',
        permission: PERMISSIONS.PAYMENT_VIEW,
      },
      {
        path: '/notifications',
        label: 'Notifications',
        icon: 'FiBell',
        permission: PERMISSIONS.NOTIFICATION_VIEW,
      },
      {
        path: '/documents',
        label: 'Documents',
        icon: 'FiFolder',
        permission: PERMISSIONS.DOCUMENT_VIEW,
      },
      {
        path: '/officers',
        label: 'Officers',
        icon: 'FiUserCheck',
        permission: PERMISSIONS.OFFICER_VIEW,
      },
      {
        path: '/academic-records',
        label: 'Records',
        icon: 'FiAward',
        permission: PERMISSIONS.RECORD_VIEW,
      },
    ],
  },
  {
    section: 'Administration',
    items: [
      {
        path: '/user-management',
        label: 'User Management',
        icon: 'FiShield',
        permission: PERMISSIONS.USER_MANAGE,
      },
    ],
  },
];