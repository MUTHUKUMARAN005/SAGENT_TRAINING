const normalizeIdentityValue = (value) => String(value ?? '').trim().toLowerCase();

const toIdentitySet = (values) => new Set(
  values.map(normalizeIdentityValue).filter(Boolean)
);

export const isStudentRoleUser = (user) =>
  normalizeIdentityValue(user?.role).toUpperCase() === 'STUDENT';

export const collectUserIdentityValues = (user) => toIdentitySet([
  user?.studentID,
  user?.studentId,
  user?.id,
  user?.userId,
  user?.userID,
  user?.username,
  user?.email,
  user?.fullName,
  user?.name,
]);

export const collectStudentIdentityValues = (student) => toIdentitySet([
  student?.studentID,
  student?.studentId,
  student?.id,
  student?.userId,
  student?.userID,
  student?.username,
  student?.email,
  student?.name,
  student?.fullName,
  student?.user?.id,
  student?.user?.userId,
  student?.user?.userID,
  student?.user?.username,
  student?.user?.email,
  student?.user?.name,
  student?.user?.fullName,
]);

export const matchesStudentToUser = (studentLike, user) => {
  const studentValues = collectStudentIdentityValues(studentLike);
  const userValues = collectUserIdentityValues(user);

  for (const value of userValues) {
    if (studentValues.has(value)) return true;
  }

  return false;
};

export const getStudentFromRecord = (record) =>
  record?.student
  || record?.application?.student
  || record?.applicationDTO?.student
  || record?.studentDTO
  || null;

export const filterStudentsForUser = (students, user) => {
  if (!isStudentRoleUser(user)) return students;
  return (Array.isArray(students) ? students : []).filter((student) => matchesStudentToUser(student, user));
};

export const filterRecordsForUser = (records, user, getStudent = getStudentFromRecord) => {
  if (!isStudentRoleUser(user)) return records;
  return (Array.isArray(records) ? records : []).filter((record) => matchesStudentToUser(getStudent(record), user));
};

export const findLinkedStudentForUser = (students, user) =>
  (Array.isArray(students) ? students : []).find((student) => matchesStudentToUser(student, user)) || null;
