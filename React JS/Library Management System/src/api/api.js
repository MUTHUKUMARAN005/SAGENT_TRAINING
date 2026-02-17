import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('library_user');
  if (user) {
    const parsed = JSON.parse(user);
    config.headers.Authorization = `Bearer ${parsed.id}`;
    config.headers['X-User-Role'] = parsed.role;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('library_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const getDashboardStats = () => api.get('/dashboard/stats');

export const getBooks = () => api.get('/books');
export const createBook = (d) => api.post('/books', d);
export const updateBook = (id, d) => api.put(`/books/${id}`, d);
export const deleteBook = (id) => api.delete(`/books/${id}`);

export const getLibraries = () => api.get('/libraries');
export const createLibrary = (d) => api.post('/libraries', d);
export const updateLibrary = (id, d) => api.put(`/libraries/${id}`, d);
export const deleteLibrary = (id) => api.delete(`/libraries/${id}`);

export const getAuthors = () => api.get('/authors');
export const createAuthor = (d) => api.post('/authors', d);
export const updateAuthor = (id, d) => api.put(`/authors/${id}`, d);
export const deleteAuthor = (id) => api.delete(`/authors/${id}`);

export const getMembers = () => api.get('/members');
export const createMember = (d) => api.post('/members', d);
export const updateMember = (id, d) => api.put(`/members/${id}`, d);
export const deleteMember = (id) => api.delete(`/members/${id}`);

export const getLibrarians = () => api.get('/librarians');
export const createLibrarian = (d) => api.post('/librarians', d);
export const updateLibrarian = (id, d) => api.put(`/librarians/${id}`, d);
export const deleteLibrarian = (id) => api.delete(`/librarians/${id}`);

export const getBookCopies = () => api.get('/book-copies');
export const createBookCopy = (d) => api.post('/book-copies', d);
export const updateBookCopy = (id, d) => api.put(`/book-copies/${id}`, d);
export const deleteBookCopy = (id) => api.delete(`/book-copies/${id}`);

export const getCatalogEntries = () => api.get('/catalog-entries');
export const createCatalogEntry = (d) => api.post('/catalog-entries', d);
export const updateCatalogEntry = (id, d) => api.put(`/catalog-entries/${id}`, d);
export const deleteCatalogEntry = (id) => api.delete(`/catalog-entries/${id}`);

export const getBorrowingRecords = () => api.get('/borrowing-records');
export const createBorrowingRecord = (d) => api.post('/borrowing-records', d);
export const updateBorrowingRecord = (id, d) => api.put(`/borrowing-records/${id}`, d);
export const deleteBorrowingRecord = (id) => api.delete(`/borrowing-records/${id}`);

export const getFines = () => api.get('/fines');
export const createFine = (d) => api.post('/fines', d);
export const updateFine = (id, d) => api.put(`/fines/${id}`, d);
export const deleteFine = (id) => api.delete(`/fines/${id}`);

export const getRequests = () => api.get('/requests');
export const createRequest = (d) => api.post('/requests', d);
export const updateRequest = (id, d) => api.put(`/requests/${id}`, d);
export const deleteRequest = (id) => api.delete(`/requests/${id}`);

export const getNotifications = () => api.get('/notifications');
export const createNotification = (d) => api.post('/notifications', d);
export const updateNotification = (id, d) => api.put(`/notifications/${id}`, d);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

export default api;