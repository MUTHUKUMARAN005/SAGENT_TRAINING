const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'data', 'database.json');
const ACTIVE_BOOK_STATUS = {
  AVAILABLE: 'Available',
  ISSUED: 'Issued'
};
const BORROW_STATUS = {
  ISSUED: 'Issued',
  RETURNED: 'Returned',
  OVERDUE: 'Overdue'
};
const CATEGORY_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};
const BOOK_COPY_STATUS = {
  AVAILABLE: 'Available',
  BORROWED: 'Borrowed',
  RESERVED: 'Reserved'
};
const FINE_STATUS = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  WAIVED: 'Waived'
};
const REQUEST_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};
const NOTIFICATION_STATUS = {
  SENT: 'Sent',
  READ: 'Read'
};

const app = express();
app.use(cors());
app.use(express.json());

const createEmptyDatabase = () => ({
  members: [],
  books: [],
  borrowingRecords: [],
  authors: [],
  libraries: [],
  librarians: [],
  categories: [],
  catalogEntries: [],
  bookCopies: [],
  fines: [],
  requests: [],
  notifications: []
});

const ensureDatabaseFile = async () => {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(createEmptyDatabase(), null, 2), 'utf8');
  }
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeMemberReference = (payload = {}) => {
  const member = payload.member || {};
  return {
    memberId: String(payload.memberId ?? member.memberId ?? '').trim(),
    memberName: String(payload.memberName ?? member.name ?? '').trim(),
    memberEmail: String(payload.memberEmail ?? member.email ?? '').trim().toLowerCase()
  };
};

const applyRequestMemberContext = (record, req) => ({
  ...record,
  memberId: record.memberId || String(req.headers['x-user-member-id'] || '').trim(),
  memberName: record.memberName || String(req.headers['x-user-name'] || '').trim(),
  memberEmail: record.memberEmail || String(req.headers['x-user-email'] || '').trim().toLowerCase()
});

const buildMemberShape = (memberId, memberName, memberEmail) => {
  if (!memberId && !memberName && !memberEmail) return undefined;
  return {
    memberId: memberId || '',
    name: memberName || '',
    email: memberEmail || ''
  };
};

const normalizeMember = (payload = {}) => ({
  memberId: String(payload.memberId || '').trim(),
  name: String(payload.name || '').trim(),
  email: String(payload.email || '').trim().toLowerCase(),
  phone: String(payload.phone || '').trim(),
  membershipDate: String(payload.membershipDate || '').trim(),
  status: String(payload.status || 'Active').trim() || 'Active'
});

const normalizeBook = (payload = {}) => {
  const totalCopies = Math.max(0, Math.trunc(toSafeNumber(payload.totalCopies, 0)));
  const availableCopies = Math.min(
    totalCopies,
    Math.max(0, Math.trunc(toSafeNumber(payload.availableCopies, totalCopies)))
  );

  return {
    bookId: String(payload.bookId || '').trim(),
    isbn: String(payload.isbn || '').trim(),
    title: String(payload.title || '').trim(),
    author: String(payload.author || '').trim(),
    category: String(payload.category || '').trim(),
    subject: String(payload.subject || '').trim(),
    edition: String(payload.edition || '').trim(),
    publicationYear: toSafeNumber(payload.publicationYear, ''),
    totalCopies,
    availableCopies,
    status: availableCopies > 0 ? ACTIVE_BOOK_STATUS.AVAILABLE : ACTIVE_BOOK_STATUS.ISSUED,
    bookImage: payload.bookImage || ''
  };
};

const normalizeBorrowingRecord = (payload = {}) => {
  const { memberId, memberName, memberEmail } = normalizeMemberReference(payload);

  const returnDate = String(payload.returnDate || '').trim();
  const status = String(
    payload.status || (returnDate ? BORROW_STATUS.RETURNED : BORROW_STATUS.ISSUED)
  ).trim();

  return {
    recordId: String(payload.recordId || '').trim(),
    memberId,
    memberName,
    memberEmail,
    member: buildMemberShape(memberId, memberName, memberEmail),
    bookId: String(payload.bookId || '').trim(),
    bookTitle: String(payload.bookTitle || '').trim(),
    linkedBookId: String(payload.linkedBookId || '').trim(),
    borrowDate: String(payload.borrowDate || '').trim(),
    dueDate: String(payload.dueDate || '').trim(),
    returnDate,
    fineAmount: Math.max(0, toSafeNumber(payload.fineAmount, 0)),
    status
  };
};

const normalizeAuthor = (payload = {}) => ({
  authorId: String(payload.authorId || '').trim(),
  name: String(payload.name || '').trim(),
  biography: String(payload.biography || '').trim()
});

const normalizeLibrary = (payload = {}) => ({
  libraryId: String(payload.libraryId || '').trim(),
  name: String(payload.name || '').trim(),
  location: String(payload.location || '').trim(),
  contactEmail: String(payload.contactEmail || '').trim().toLowerCase()
});

const normalizeLibrarian = (payload = {}) => ({
  librarianId: String(payload.librarianId || '').trim(),
  name: String(payload.name || '').trim(),
  email: String(payload.email || '').trim().toLowerCase(),
  password: String(payload.password || '').trim(),
  role: String(payload.role || '').trim()
});

const normalizeCategory = (payload = {}) => ({
  categoryId: String(payload.categoryId || '').trim(),
  name: String(payload.name || '').trim(),
  description: String(payload.description || '').trim(),
  status: String(payload.status || CATEGORY_STATUS.ACTIVE).trim() || CATEGORY_STATUS.ACTIVE
});

const normalizeCatalogEntry = (payload = {}) => {
  const book = payload.book || {};
  const library = payload.library || {};

  return {
    entryId: String(payload.entryId || '').trim(),
    bookId: String(payload.bookId ?? book.bookId ?? '').trim(),
    libraryId: String(payload.libraryId ?? library.libraryId ?? '').trim(),
    book: book.title ? { title: String(book.title).trim() } : undefined,
    library: library.name ? { name: String(library.name).trim() } : undefined,
    dateAdded: String(payload.dateAdded || '').trim(),
    lastUpdated: String(payload.lastUpdated || '').trim()
  };
};

const normalizeBookCopy = (payload = {}) => {
  const book = payload.book || {};
  const library = payload.library || {};

  return {
    copyId: String(payload.copyId || '').trim(),
    bookId: String(payload.bookId ?? book.bookId ?? '').trim(),
    libraryId: String(payload.libraryId ?? library.libraryId ?? '').trim(),
    book: book.title ? { title: String(book.title).trim() } : undefined,
    library: library.name ? { name: String(library.name).trim() } : undefined,
    status: String(payload.status || BOOK_COPY_STATUS.AVAILABLE).trim() || BOOK_COPY_STATUS.AVAILABLE,
    location: String(payload.location || '').trim()
  };
};

const normalizeFine = (payload = {}) => {
  const { memberId, memberName, memberEmail } = normalizeMemberReference(payload);
  return {
    fineId: String(payload.fineId || '').trim(),
    memberId,
    memberName,
    memberEmail,
    member: buildMemberShape(memberId, memberName, memberEmail),
    amount: Math.max(0, toSafeNumber(payload.amount, 0)),
    status: String(payload.status || FINE_STATUS.UNPAID).trim() || FINE_STATUS.UNPAID,
    dueDate: String(payload.dueDate || '').trim(),
    paidDate: String(payload.paidDate || '').trim()
  };
};

const normalizeRequest = (payload = {}) => {
  const { memberId, memberName, memberEmail } = normalizeMemberReference(payload);
  return {
    requestId: String(payload.requestId || '').trim(),
    memberId,
    memberName,
    memberEmail,
    member: buildMemberShape(memberId, memberName, memberEmail),
    type: String(payload.type || '').trim(),
    message: String(payload.message || '').trim(),
    requestDate: String(payload.requestDate || '').trim(),
    status: String(payload.status || REQUEST_STATUS.PENDING).trim() || REQUEST_STATUS.PENDING
  };
};

const normalizeNotification = (payload = {}) => {
  const { memberId, memberName, memberEmail } = normalizeMemberReference(payload);
  return {
    notificationId: String(payload.notificationId || '').trim(),
    memberId,
    memberName,
    memberEmail,
    member: buildMemberShape(memberId, memberName, memberEmail),
    type: String(payload.type || '').trim(),
    message: String(payload.message || '').trim(),
    sentDate: String(payload.sentDate || '').trim(),
    status: String(payload.status || NOTIFICATION_STATUS.SENT).trim() || NOTIFICATION_STATUS.SENT
  };
};

const validateMember = (member) => {
  if (!member.memberId) return 'memberId is required';
  if (!member.name) return 'name is required';
  if (!member.email) return 'email is required';
  if (!member.membershipDate) return 'membershipDate is required';
  if (!['Active', 'Inactive'].includes(member.status)) return 'status must be Active or Inactive';
  return null;
};

const validateBook = (book) => {
  if (!book.bookId) return 'bookId is required';
  if (!book.title) return 'title is required';
  if (!book.author) return 'author is required';
  if (book.totalCopies < 0) return 'totalCopies cannot be negative';
  if (book.availableCopies < 0) return 'availableCopies cannot be negative';
  if (book.availableCopies > book.totalCopies) return 'availableCopies cannot exceed totalCopies';
  return null;
};

const validateBorrowingRecord = (record) => {
  if (!record.recordId) return 'recordId is required';
  if (!record.memberId) return 'memberId is required';
  if (!record.memberName) return 'memberName is required';
  if (!record.bookTitle && !record.bookId) return 'bookTitle or bookId is required';
  if (!record.borrowDate) return 'borrowDate is required';
  if (!record.dueDate) return 'dueDate is required';
  if (!Object.values(BORROW_STATUS).includes(record.status)) {
    return 'status must be Issued, Returned, or Overdue';
  }
  return null;
};

const validateAuthor = (author) => {
  if (!author.authorId) return 'authorId is required';
  if (!author.name) return 'name is required';
  return null;
};

const validateLibrary = (library) => {
  if (!library.libraryId) return 'libraryId is required';
  if (!library.name) return 'name is required';
  if (!library.location) return 'location is required';
  if (!library.contactEmail) return 'contactEmail is required';
  return null;
};

const validateLibrarian = (librarian) => {
  if (!librarian.librarianId) return 'librarianId is required';
  if (!librarian.name) return 'name is required';
  if (!librarian.email) return 'email is required';
  if (!librarian.role) return 'role is required';
  return null;
};

const validateCategory = (category) => {
  if (!category.categoryId) return 'categoryId is required';
  if (!category.name) return 'name is required';
  if (!Object.values(CATEGORY_STATUS).includes(category.status)) {
    return 'status must be Active or Inactive';
  }
  return null;
};

const validateCatalogEntry = (entry) => {
  if (!entry.entryId) return 'entryId is required';
  if (!entry.dateAdded) return 'dateAdded is required';
  return null;
};

const validateBookCopy = (copy) => {
  if (!copy.copyId) return 'copyId is required';
  if (!copy.bookId) return 'bookId is required';
  if (!copy.libraryId) return 'libraryId is required';
  if (!Object.values(BOOK_COPY_STATUS).includes(copy.status)) {
    return 'status must be Available, Borrowed, or Reserved';
  }
  return null;
};

const validateFine = (fine) => {
  if (!fine.fineId) return 'fineId is required';
  if (fine.amount < 0) return 'amount cannot be negative';
  if (!fine.dueDate) return 'dueDate is required';
  if (!Object.values(FINE_STATUS).includes(fine.status)) {
    return 'status must be Unpaid, Paid, or Waived';
  }
  return null;
};

const validateRequest = (request) => {
  if (!request.requestId) return 'requestId is required';
  if (!request.type) return 'type is required';
  if (!request.message) return 'message is required';
  if (!request.requestDate) return 'requestDate is required';
  if (!Object.values(REQUEST_STATUS).includes(request.status)) {
    return 'status must be Pending, Approved, Completed, Rejected, or Cancelled';
  }
  return null;
};

const validateNotification = (notification) => {
  if (!notification.notificationId) return 'notificationId is required';
  if (!notification.type) return 'type is required';
  if (!notification.message) return 'message is required';
  if (!notification.sentDate) return 'sentDate is required';
  if (!Object.values(NOTIFICATION_STATUS).includes(notification.status)) {
    return 'status must be Sent or Read';
  }
  return null;
};

const readDatabase = async () => {
  await ensureDatabaseFile();
  const file = await fs.readFile(DB_PATH, 'utf8');
  const parsed = JSON.parse(file || '{}');
  return {
    members: Array.isArray(parsed.members) ? parsed.members.map(normalizeMember) : [],
    books: Array.isArray(parsed.books) ? parsed.books.map(normalizeBook) : [],
    borrowingRecords: Array.isArray(parsed.borrowingRecords)
      ? parsed.borrowingRecords.map(normalizeBorrowingRecord)
      : [],
    authors: Array.isArray(parsed.authors) ? parsed.authors.map(normalizeAuthor) : [],
    libraries: Array.isArray(parsed.libraries) ? parsed.libraries.map(normalizeLibrary) : [],
    librarians: Array.isArray(parsed.librarians) ? parsed.librarians.map(normalizeLibrarian) : [],
    categories: Array.isArray(parsed.categories) ? parsed.categories.map(normalizeCategory) : [],
    catalogEntries: Array.isArray(parsed.catalogEntries)
      ? parsed.catalogEntries.map(normalizeCatalogEntry)
      : [],
    bookCopies: Array.isArray(parsed.bookCopies) ? parsed.bookCopies.map(normalizeBookCopy) : [],
    fines: Array.isArray(parsed.fines) ? parsed.fines.map(normalizeFine) : [],
    requests: Array.isArray(parsed.requests) ? parsed.requests.map(normalizeRequest) : [],
    notifications: Array.isArray(parsed.notifications)
      ? parsed.notifications.map(normalizeNotification)
      : []
  };
};

const writeDatabase = async (nextDb) => {
  await fs.writeFile(DB_PATH, JSON.stringify(nextDb, null, 2), 'utf8');
};

const updateBookStatus = (book) => {
  book.status = book.availableCopies > 0 ? ACTIVE_BOOK_STATUS.AVAILABLE : ACTIVE_BOOK_STATUS.ISSUED;
};

const decrementBookAvailability = (book) => {
  if (!book || book.availableCopies <= 0) {
    throw new Error('No available copies for this book');
  }
  book.availableCopies -= 1;
  updateBookStatus(book);
};

const incrementBookAvailability = (book) => {
  if (!book) return;
  const safeTotal = Math.max(0, Math.trunc(toSafeNumber(book.totalCopies, 0)));
  book.totalCopies = safeTotal;
  book.availableCopies = Math.min(safeTotal, Math.max(0, Math.trunc(toSafeNumber(book.availableCopies, 0)) + 1));
  updateBookStatus(book);
};

const findBookByTitle = (books, title) => {
  const normalized = String(title || '').trim().toLowerCase();
  if (!normalized) return null;
  return books.find((book) => book.title.toLowerCase() === normalized) || null;
};

const resolveBookForBorrowing = (books, record, fallbackBookId = '') => {
  if (record.bookId) {
    return books.find((book) => book.bookId === record.bookId) || null;
  }

  const byTitle = findBookByTitle(books, record.bookTitle);
  if (byTitle) return byTitle;

  if (fallbackBookId) {
    return books.find((book) => book.bookId === fallbackBookId) || null;
  }

  return null;
};

const enrichMemberDetails = (record, members) => {
  const normalizedEmail = String(record.memberEmail || '').toLowerCase();
  const memberFromDb = members.find((item) => (
    (record.memberId && item.memberId === record.memberId)
    || (normalizedEmail && item.email.toLowerCase() === normalizedEmail)
  ));

  const resolvedMemberId = record.memberId || memberFromDb?.memberId || '';
  const resolvedName = record.memberName || memberFromDb?.name || '';
  const resolvedEmail = normalizedEmail || memberFromDb?.email || '';

  return {
    ...record,
    memberId: resolvedMemberId,
    memberName: resolvedName,
    memberEmail: resolvedEmail,
    member: buildMemberShape(resolvedMemberId, resolvedName, resolvedEmail)
  };
};

const withBookAndLibrarySnapshot = (record, db) => {
  const bookFromDb = db.books.find((item) => item.bookId === record.bookId);
  const libraryFromDb = db.libraries.find((item) => item.libraryId === record.libraryId);

  return {
    ...record,
    book: bookFromDb
      ? { title: bookFromDb.title }
      : (record.book?.title ? { title: record.book.title } : undefined),
    library: libraryFromDb
      ? { name: libraryFromDb.name }
      : (record.library?.name ? { name: record.library.name } : undefined)
  };
};

const withCatalogSnapshots = (record, db) => {
  const bookFromDb = db.books.find((item) => item.bookId === record.bookId);
  const libraryFromDb = db.libraries.find((item) => item.libraryId === record.libraryId);

  return {
    ...record,
    book: bookFromDb
      ? { title: bookFromDb.title }
      : (record.book?.title ? { title: record.book.title } : undefined),
    library: libraryFromDb
      ? { name: libraryFromDb.name }
      : (record.library?.name ? { name: record.library.name } : undefined)
  };
};

app.get('/api/health', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json({
      ok: true,
      members: db.members.length,
      books: db.books.length,
      borrowingRecords: db.borrowingRecords.length
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/dashboard/stats', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    const totalBooks = db.books.length;
    const issuedBooks = db.books.reduce(
      (sum, book) => sum + Math.max(0, (book.totalCopies || 0) - (book.availableCopies || 0)),
      0
    );
    const availableBooks = db.books.reduce((sum, book) => sum + (book.availableCopies || 0), 0);
    const totalStudents = db.members.length;
    const categoriesCount = db.categories.length || new Set(
      db.books.map((book) => book.category || book.subject).filter(Boolean)
    ).size;
    const activeBorrowings = db.borrowingRecords.filter((record) => !record.returnDate).length;
    const unpaidRows = db.fines.filter((fine) => fine.status === FINE_STATUS.UNPAID);
    const pendingRequests = db.requests.filter((request) => request.status === REQUEST_STATUS.PENDING).length;

    res.json({
      totalBooks,
      issuedBooks,
      availableBooks,
      totalStudents,
      categoriesCount,
      activeBorrowings,
      unpaidFines: unpaidRows.length,
      totalUnpaidAmount: unpaidRows.reduce((sum, fine) => sum + toSafeNumber(fine.amount, 0), 0),
      pendingRequests
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/members', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.members);
  } catch (error) {
    next(error);
  }
});

app.post('/api/members', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextMember = normalizeMember(req.body);
    const validationError = validateMember(nextMember);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateMemberId = db.members.some((item) => item.memberId === nextMember.memberId);
    if (duplicateMemberId) {
      res.status(409).json({ message: 'memberId already exists' });
      return;
    }

    const duplicateEmail = db.members.some((item) => item.email.toLowerCase() === nextMember.email.toLowerCase());
    if (duplicateEmail) {
      res.status(409).json({ message: 'email already exists' });
      return;
    }

    db.members.push(nextMember);
    await writeDatabase(db);
    res.status(201).json(nextMember);
  } catch (error) {
    next(error);
  }
});

app.put('/api/members/:memberId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.members.findIndex((item) => item.memberId === req.params.memberId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    const incoming = normalizeMember(req.body);
    const nextMember = {
      ...incoming,
      memberId: req.params.memberId
    };

    const validationError = validateMember(nextMember);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateEmail = db.members.some((item, index) => (
      index !== targetIndex && item.email.toLowerCase() === nextMember.email.toLowerCase()
    ));
    if (duplicateEmail) {
      res.status(409).json({ message: 'email already exists' });
      return;
    }

    db.members[targetIndex] = nextMember;
    await writeDatabase(db);
    res.json(nextMember);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/members/:memberId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.members.findIndex((item) => item.memberId === req.params.memberId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    const [removed] = db.members.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/books', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.books);
  } catch (error) {
    next(error);
  }
});

app.post('/api/books', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextBook = normalizeBook(req.body);
    const validationError = validateBook(nextBook);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateBookId = db.books.some((item) => item.bookId === nextBook.bookId);
    if (duplicateBookId) {
      res.status(409).json({ message: 'bookId already exists' });
      return;
    }

    db.books.push(nextBook);
    await writeDatabase(db);
    res.status(201).json(nextBook);
  } catch (error) {
    next(error);
  }
});

app.put('/api/books/:bookId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.books.findIndex((item) => item.bookId === req.params.bookId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    const incoming = normalizeBook(req.body);
    const activeBorrowedCount = db.borrowingRecords.filter((record) => (
      record.linkedBookId === req.params.bookId && !record.returnDate
    )).length;
    if (incoming.totalCopies < activeBorrowedCount) {
      res.status(400).json({ message: `Cannot reduce total copies below active borrowings (${activeBorrowedCount})` });
      return;
    }

    const maxAvailable = Math.max(0, incoming.totalCopies - activeBorrowedCount);
    const nextBook = {
      ...incoming,
      bookId: req.params.bookId,
      availableCopies: Math.min(incoming.availableCopies, maxAvailable)
    };
    updateBookStatus(nextBook);

    const validationError = validateBook(nextBook);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    db.books[targetIndex] = nextBook;
    await writeDatabase(db);
    res.json(nextBook);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/books/:bookId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.books.findIndex((item) => item.bookId === req.params.bookId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    const activeBorrowExists = db.borrowingRecords.some((record) => (
      record.linkedBookId === req.params.bookId && !record.returnDate
    ));
    if (activeBorrowExists) {
      res.status(400).json({ message: 'Cannot delete a book with active borrowings' });
      return;
    }

    const [removed] = db.books.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/borrowing-records', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.borrowingRecords);
  } catch (error) {
    next(error);
  }
});

app.post('/api/borrowing-records', async (req, res, next) => {
  try {
    const db = await readDatabase();
    let nextRecord = normalizeBorrowingRecord(req.body);
    const validationError = validateBorrowingRecord(nextRecord);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateRecordId = db.borrowingRecords.some((item) => item.recordId === nextRecord.recordId);
    if (duplicateRecordId) {
      res.status(409).json({ message: 'recordId already exists' });
      return;
    }

    const targetBook = resolveBookForBorrowing(db.books, nextRecord);
    if (!targetBook) {
      res.status(400).json({ message: 'Book not found. Use exact title from Books page or provide bookId.' });
      return;
    }

    nextRecord = {
      ...nextRecord,
      bookId: targetBook.bookId,
      bookTitle: targetBook.title,
      linkedBookId: targetBook.bookId
    };
    nextRecord = enrichMemberDetails(nextRecord, db.members);

    if (!nextRecord.returnDate) {
      decrementBookAvailability(targetBook);
    }

    db.borrowingRecords.push(nextRecord);
    await writeDatabase(db);
    res.status(201).json(nextRecord);
  } catch (error) {
    if (error.message === 'No available copies for this book') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});

app.put('/api/borrowing-records/:recordId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.borrowingRecords.findIndex((item) => item.recordId === req.params.recordId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Borrowing record not found' });
      return;
    }

    const previous = db.borrowingRecords[targetIndex];
    let nextRecord = normalizeBorrowingRecord(req.body);
    nextRecord.recordId = req.params.recordId;

    const nextBook = resolveBookForBorrowing(db.books, nextRecord, previous.linkedBookId);
    if (!nextBook) {
      res.status(400).json({ message: 'Book not found. Use exact title from Books page or provide bookId.' });
      return;
    }

    nextRecord = {
      ...nextRecord,
      bookId: nextBook.bookId,
      bookTitle: nextBook.title,
      linkedBookId: nextBook.bookId
    };
    nextRecord = enrichMemberDetails(nextRecord, db.members);

    const validationError = validateBorrowingRecord(nextRecord);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const previousBook = db.books.find((book) => book.bookId === previous.linkedBookId)
      || findBookByTitle(db.books, previous.bookTitle);

    const wasReturned = Boolean(previous.returnDate);
    const isReturned = Boolean(nextRecord.returnDate);

    if (previousBook && previousBook.bookId === nextBook.bookId) {
      if (!wasReturned && isReturned) {
        incrementBookAvailability(previousBook);
      } else if (wasReturned && !isReturned) {
        decrementBookAvailability(previousBook);
      }
    } else {
      if (previousBook && !wasReturned) {
        incrementBookAvailability(previousBook);
      }
      if (!isReturned) {
        decrementBookAvailability(nextBook);
      }
    }

    db.borrowingRecords[targetIndex] = nextRecord;
    await writeDatabase(db);
    res.json(nextRecord);
  } catch (error) {
    if (error.message === 'No available copies for this book') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});

app.delete('/api/borrowing-records/:recordId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.borrowingRecords.findIndex((item) => item.recordId === req.params.recordId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Borrowing record not found' });
      return;
    }

    const [removed] = db.borrowingRecords.splice(targetIndex, 1);
    if (!removed.returnDate) {
      const linkedBook = db.books.find((book) => book.bookId === removed.linkedBookId)
        || findBookByTitle(db.books, removed.bookTitle);
      incrementBookAvailability(linkedBook);
    }

    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/authors', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.authors);
  } catch (error) {
    next(error);
  }
});

app.post('/api/authors', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextAuthor = normalizeAuthor(req.body);
    const validationError = validateAuthor(nextAuthor);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.authors.some((item) => item.authorId === nextAuthor.authorId);
    if (duplicateId) {
      res.status(409).json({ message: 'authorId already exists' });
      return;
    }

    db.authors.push(nextAuthor);
    await writeDatabase(db);
    res.status(201).json(nextAuthor);
  } catch (error) {
    next(error);
  }
});

app.put('/api/authors/:authorId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.authors.findIndex((item) => item.authorId === req.params.authorId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Author not found' });
      return;
    }

    const nextAuthor = {
      ...normalizeAuthor(req.body),
      authorId: req.params.authorId
    };
    const validationError = validateAuthor(nextAuthor);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    db.authors[targetIndex] = nextAuthor;
    await writeDatabase(db);
    res.json(nextAuthor);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/authors/:authorId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.authors.findIndex((item) => item.authorId === req.params.authorId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Author not found' });
      return;
    }

    const [removed] = db.authors.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/libraries', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.libraries);
  } catch (error) {
    next(error);
  }
});

app.post('/api/libraries', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextLibrary = normalizeLibrary(req.body);
    const validationError = validateLibrary(nextLibrary);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.libraries.some((item) => item.libraryId === nextLibrary.libraryId);
    if (duplicateId) {
      res.status(409).json({ message: 'libraryId already exists' });
      return;
    }

    const duplicateEmail = db.libraries.some(
      (item) => item.contactEmail.toLowerCase() === nextLibrary.contactEmail.toLowerCase()
    );
    if (duplicateEmail) {
      res.status(409).json({ message: 'contactEmail already exists' });
      return;
    }

    db.libraries.push(nextLibrary);
    await writeDatabase(db);
    res.status(201).json(nextLibrary);
  } catch (error) {
    next(error);
  }
});

app.put('/api/libraries/:libraryId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.libraries.findIndex((item) => item.libraryId === req.params.libraryId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    const nextLibrary = {
      ...normalizeLibrary(req.body),
      libraryId: req.params.libraryId
    };
    const validationError = validateLibrary(nextLibrary);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateEmail = db.libraries.some((item, index) => (
      index !== targetIndex && item.contactEmail.toLowerCase() === nextLibrary.contactEmail.toLowerCase()
    ));
    if (duplicateEmail) {
      res.status(409).json({ message: 'contactEmail already exists' });
      return;
    }

    db.libraries[targetIndex] = nextLibrary;
    await writeDatabase(db);
    res.json(nextLibrary);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/libraries/:libraryId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.libraries.findIndex((item) => item.libraryId === req.params.libraryId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    const inUseByCopy = db.bookCopies.some((item) => item.libraryId === req.params.libraryId);
    const inUseByCatalog = db.catalogEntries.some((item) => item.libraryId === req.params.libraryId);
    if (inUseByCopy || inUseByCatalog) {
      res.status(400).json({ message: 'Cannot delete library while linked records exist' });
      return;
    }

    const [removed] = db.libraries.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/librarians', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.librarians);
  } catch (error) {
    next(error);
  }
});

app.post('/api/librarians', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextLibrarian = normalizeLibrarian(req.body);
    const validationError = validateLibrarian(nextLibrarian);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.librarians.some((item) => item.librarianId === nextLibrarian.librarianId);
    if (duplicateId) {
      res.status(409).json({ message: 'librarianId already exists' });
      return;
    }

    const duplicateEmail = db.librarians.some(
      (item) => item.email.toLowerCase() === nextLibrarian.email.toLowerCase()
    );
    if (duplicateEmail) {
      res.status(409).json({ message: 'email already exists' });
      return;
    }

    db.librarians.push(nextLibrarian);
    await writeDatabase(db);
    res.status(201).json(nextLibrarian);
  } catch (error) {
    next(error);
  }
});

app.put('/api/librarians/:librarianId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.librarians.findIndex((item) => item.librarianId === req.params.librarianId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Librarian not found' });
      return;
    }

    const previous = db.librarians[targetIndex];
    const incoming = normalizeLibrarian(req.body);
    const nextLibrarian = {
      ...incoming,
      librarianId: req.params.librarianId,
      password: incoming.password || previous.password
    };
    const validationError = validateLibrarian(nextLibrarian);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateEmail = db.librarians.some((item, index) => (
      index !== targetIndex && item.email.toLowerCase() === nextLibrarian.email.toLowerCase()
    ));
    if (duplicateEmail) {
      res.status(409).json({ message: 'email already exists' });
      return;
    }

    db.librarians[targetIndex] = nextLibrarian;
    await writeDatabase(db);
    res.json(nextLibrarian);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/librarians/:librarianId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.librarians.findIndex((item) => item.librarianId === req.params.librarianId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Librarian not found' });
      return;
    }

    const [removed] = db.librarians.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/categories', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.categories);
  } catch (error) {
    next(error);
  }
});

app.post('/api/categories', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextCategory = normalizeCategory(req.body);
    const validationError = validateCategory(nextCategory);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.categories.some((item) => item.categoryId === nextCategory.categoryId);
    if (duplicateId) {
      res.status(409).json({ message: 'categoryId already exists' });
      return;
    }

    db.categories.push(nextCategory);
    await writeDatabase(db);
    res.status(201).json(nextCategory);
  } catch (error) {
    next(error);
  }
});

app.put('/api/categories/:categoryId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.categories.findIndex((item) => item.categoryId === req.params.categoryId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const nextCategory = {
      ...normalizeCategory(req.body),
      categoryId: req.params.categoryId
    };
    const validationError = validateCategory(nextCategory);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    db.categories[targetIndex] = nextCategory;
    await writeDatabase(db);
    res.json(nextCategory);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/categories/:categoryId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.categories.findIndex((item) => item.categoryId === req.params.categoryId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const [removed] = db.categories.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog-entries', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.catalogEntries);
  } catch (error) {
    next(error);
  }
});

app.post('/api/catalog-entries', async (req, res, next) => {
  try {
    const db = await readDatabase();
    let nextEntry = normalizeCatalogEntry(req.body);
    const validationError = validateCatalogEntry(nextEntry);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.catalogEntries.some((item) => item.entryId === nextEntry.entryId);
    if (duplicateId) {
      res.status(409).json({ message: 'entryId already exists' });
      return;
    }

    if (nextEntry.bookId && !db.books.some((item) => item.bookId === nextEntry.bookId)) {
      res.status(400).json({ message: 'bookId does not exist' });
      return;
    }
    if (nextEntry.libraryId && !db.libraries.some((item) => item.libraryId === nextEntry.libraryId)) {
      res.status(400).json({ message: 'libraryId does not exist' });
      return;
    }

    nextEntry = withCatalogSnapshots(nextEntry, db);
    db.catalogEntries.push(nextEntry);
    await writeDatabase(db);
    res.status(201).json(nextEntry);
  } catch (error) {
    next(error);
  }
});

app.put('/api/catalog-entries/:entryId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.catalogEntries.findIndex((item) => item.entryId === req.params.entryId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Catalog entry not found' });
      return;
    }

    let nextEntry = {
      ...normalizeCatalogEntry(req.body),
      entryId: req.params.entryId
    };
    const validationError = validateCatalogEntry(nextEntry);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    if (nextEntry.bookId && !db.books.some((item) => item.bookId === nextEntry.bookId)) {
      res.status(400).json({ message: 'bookId does not exist' });
      return;
    }
    if (nextEntry.libraryId && !db.libraries.some((item) => item.libraryId === nextEntry.libraryId)) {
      res.status(400).json({ message: 'libraryId does not exist' });
      return;
    }

    nextEntry = withCatalogSnapshots(nextEntry, db);
    db.catalogEntries[targetIndex] = nextEntry;
    await writeDatabase(db);
    res.json(nextEntry);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/catalog-entries/:entryId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.catalogEntries.findIndex((item) => item.entryId === req.params.entryId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Catalog entry not found' });
      return;
    }

    const [removed] = db.catalogEntries.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/book-copies', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.bookCopies);
  } catch (error) {
    next(error);
  }
});

app.post('/api/book-copies', async (req, res, next) => {
  try {
    const db = await readDatabase();
    let nextCopy = normalizeBookCopy(req.body);
    const validationError = validateBookCopy(nextCopy);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.bookCopies.some((item) => item.copyId === nextCopy.copyId);
    if (duplicateId) {
      res.status(409).json({ message: 'copyId already exists' });
      return;
    }

    if (!db.books.some((item) => item.bookId === nextCopy.bookId)) {
      res.status(400).json({ message: 'bookId does not exist' });
      return;
    }
    if (!db.libraries.some((item) => item.libraryId === nextCopy.libraryId)) {
      res.status(400).json({ message: 'libraryId does not exist' });
      return;
    }

    nextCopy = withBookAndLibrarySnapshot(nextCopy, db);
    db.bookCopies.push(nextCopy);
    await writeDatabase(db);
    res.status(201).json(nextCopy);
  } catch (error) {
    next(error);
  }
});

app.put('/api/book-copies/:copyId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.bookCopies.findIndex((item) => item.copyId === req.params.copyId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Book copy not found' });
      return;
    }

    let nextCopy = {
      ...normalizeBookCopy(req.body),
      copyId: req.params.copyId
    };
    const validationError = validateBookCopy(nextCopy);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    if (!db.books.some((item) => item.bookId === nextCopy.bookId)) {
      res.status(400).json({ message: 'bookId does not exist' });
      return;
    }
    if (!db.libraries.some((item) => item.libraryId === nextCopy.libraryId)) {
      res.status(400).json({ message: 'libraryId does not exist' });
      return;
    }

    nextCopy = withBookAndLibrarySnapshot(nextCopy, db);
    db.bookCopies[targetIndex] = nextCopy;
    await writeDatabase(db);
    res.json(nextCopy);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/book-copies/:copyId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.bookCopies.findIndex((item) => item.copyId === req.params.copyId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Book copy not found' });
      return;
    }

    const [removed] = db.bookCopies.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/fines', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.fines);
  } catch (error) {
    next(error);
  }
});

app.post('/api/fines', async (req, res, next) => {
  try {
    const db = await readDatabase();
    let nextFine = normalizeFine(req.body);
    nextFine = applyRequestMemberContext(nextFine, req);
    nextFine = enrichMemberDetails(nextFine, db.members);

    const validationError = validateFine(nextFine);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.fines.some((item) => item.fineId === nextFine.fineId);
    if (duplicateId) {
      res.status(409).json({ message: 'fineId already exists' });
      return;
    }

    db.fines.push(nextFine);
    await writeDatabase(db);
    res.status(201).json(nextFine);
  } catch (error) {
    next(error);
  }
});

app.put('/api/fines/:fineId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.fines.findIndex((item) => item.fineId === req.params.fineId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Fine not found' });
      return;
    }

    let nextFine = {
      ...normalizeFine(req.body),
      fineId: req.params.fineId
    };
    nextFine = applyRequestMemberContext(nextFine, req);
    nextFine = enrichMemberDetails(nextFine, db.members);

    const validationError = validateFine(nextFine);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    db.fines[targetIndex] = nextFine;
    await writeDatabase(db);
    res.json(nextFine);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/fines/:fineId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.fines.findIndex((item) => item.fineId === req.params.fineId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Fine not found' });
      return;
    }

    const [removed] = db.fines.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/requests', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.requests);
  } catch (error) {
    next(error);
  }
});

app.post('/api/requests', async (req, res, next) => {
  try {
    const db = await readDatabase();
    let nextRequest = normalizeRequest(req.body);
    nextRequest = applyRequestMemberContext(nextRequest, req);
    nextRequest = enrichMemberDetails(nextRequest, db.members);

    const validationError = validateRequest(nextRequest);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.requests.some((item) => item.requestId === nextRequest.requestId);
    if (duplicateId) {
      res.status(409).json({ message: 'requestId already exists' });
      return;
    }

    db.requests.push(nextRequest);
    await writeDatabase(db);
    res.status(201).json(nextRequest);
  } catch (error) {
    next(error);
  }
});

app.put('/api/requests/:requestId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.requests.findIndex((item) => item.requestId === req.params.requestId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    let nextRequest = {
      ...normalizeRequest(req.body),
      requestId: req.params.requestId
    };
    nextRequest = applyRequestMemberContext(nextRequest, req);
    nextRequest = enrichMemberDetails(nextRequest, db.members);

    const validationError = validateRequest(nextRequest);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    db.requests[targetIndex] = nextRequest;
    await writeDatabase(db);
    res.json(nextRequest);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/requests/:requestId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.requests.findIndex((item) => item.requestId === req.params.requestId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    const [removed] = db.requests.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.get('/api/notifications', async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.notifications);
  } catch (error) {
    next(error);
  }
});

app.post('/api/notifications', async (req, res, next) => {
  try {
    const db = await readDatabase();
    let nextNotification = normalizeNotification(req.body);
    nextNotification = applyRequestMemberContext(nextNotification, req);
    nextNotification = enrichMemberDetails(nextNotification, db.members);

    const validationError = validateNotification(nextNotification);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const duplicateId = db.notifications.some((item) => item.notificationId === nextNotification.notificationId);
    if (duplicateId) {
      res.status(409).json({ message: 'notificationId already exists' });
      return;
    }

    db.notifications.push(nextNotification);
    await writeDatabase(db);
    res.status(201).json(nextNotification);
  } catch (error) {
    next(error);
  }
});

app.put('/api/notifications/:notificationId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.notifications.findIndex((item) => item.notificationId === req.params.notificationId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    let nextNotification = {
      ...normalizeNotification(req.body),
      notificationId: req.params.notificationId
    };
    nextNotification = applyRequestMemberContext(nextNotification, req);
    nextNotification = enrichMemberDetails(nextNotification, db.members);

    const validationError = validateNotification(nextNotification);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    db.notifications[targetIndex] = nextNotification;
    await writeDatabase(db);
    res.json(nextNotification);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/notifications/:notificationId', async (req, res, next) => {
  try {
    const db = await readDatabase();
    const targetIndex = db.notifications.findIndex((item) => item.notificationId === req.params.notificationId);
    if (targetIndex < 0) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const [removed] = db.notifications.splice(targetIndex, 1);
    await writeDatabase(db);
    res.json(removed);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: 'Internal server error', detail: error.message });
});

app.listen(PORT, async () => {
  await ensureDatabaseFile();
  console.log(`Library API running on http://localhost:${PORT}/api`);
});
