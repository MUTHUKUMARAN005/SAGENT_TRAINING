import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// API Service Functions
export const userAPI = {
    getAll: () => API.get('/users'),
    getById: (id) => API.get(`/users/${id}`),
    create: (data) => API.post('/users', data),
    update: (id, data) => API.put(`/users/${id}`, data),
    delete: (id) => API.delete(`/users/${id}`),
};

export const accountAPI = {
    getAll: () => API.get('/accounts'),
    getByUser: (userId) => API.get(`/accounts/user/${userId}`),
    getBalance: (userId) => API.get(`/accounts/user/${userId}/balance`),
    create: (data) => API.post('/accounts', data),
    update: (id, data) => API.put(`/accounts/${id}`, data),
    delete: (id) => API.delete(`/accounts/${id}`),
};

export const categoryAPI = {
    getAll: () => API.get('/categories'),
    getForUser: (userId) => API.get(`/categories/user/${userId}`),
    create: (data) => API.post('/categories', data),
    update: (id, data) => API.put(`/categories/${id}`, data),
    delete: (id) => API.delete(`/categories/${id}`),
};

export const incomeAPI = {
    getAll: () => API.get('/incomes'),
    getByUser: (userId) => API.get(`/incomes/user/${userId}`),
    getTotal: (userId) => API.get(`/incomes/user/${userId}/total`),
    create: (data) => API.post('/incomes', data),
    update: (id, data) => API.put(`/incomes/${id}`, data),
    delete: (id) => API.delete(`/incomes/${id}`),
};

export const expenseAPI = {
    getAll: () => API.get('/expenses'),
    getByUser: (userId) => API.get(`/expenses/user/${userId}`),
    getTotal: (userId) => API.get(`/expenses/user/${userId}/total`),
    getByCategory: (userId) => API.get(`/expenses/user/${userId}/by-category`),
    create: (data) => API.post('/expenses', data),
    update: (id, data) => API.put(`/expenses/${id}`, data),
    delete: (id) => API.delete(`/expenses/${id}`),
};

export const goalAPI = {
    getAll: () => API.get('/goals'),
    getByUser: (userId) => API.get(`/goals/user/${userId}`),
    create: (data) => API.post('/goals', data),
    update: (id, data) => API.put(`/goals/${id}`, data),
    contribute: (id, amount) => API.patch(`/goals/${id}/contribute?amount=${amount}`),
    delete: (id) => API.delete(`/goals/${id}`),
};

export const transferAPI = {
    getAll: () => API.get('/transfers'),
    getByUser: (userId) => API.get(`/transfers/user/${userId}`),
    create: (data) => API.post('/transfers', data),
    delete: (id) => API.delete(`/transfers/${id}`),
};

export const recurringAPI = {
    getAll: () => API.get('/recurring'),
    getByUser: (userId) => API.get(`/recurring/user/${userId}`),
    create: (data) => API.post('/recurring', data),
    update: (id, data) => API.put(`/recurring/${id}`, data),
    delete: (id) => API.delete(`/recurring/${id}`),
};

export const alertAPI = {
    getByUser: (userId) => API.get(`/alerts/user/${userId}`),
    getUnread: (userId) => API.get(`/alerts/user/${userId}/unread`),
    getUnreadCount: (userId) => API.get(`/alerts/user/${userId}/unread/count`),
    markRead: (id) => API.patch(`/alerts/${id}/read`),
    create: (data) => API.post('/alerts', data),
    delete: (id) => API.delete(`/alerts/${id}`),
};

export const budgetAPI = {
    getAll: () => API.get('/budgets'),
    getByUser: (userId) => API.get(`/budgets/user/${userId}`),
    getByMonth: (userId, month) => API.get(`/budgets/user/${userId}/month/${month}`),
    create: (data) => API.post('/budgets', data),
    update: (id, data) => API.put(`/budgets/${id}`, data),
    delete: (id) => API.delete(`/budgets/${id}`),
};

export const reportAPI = {
    getByUser: (userId) => API.get(`/reports/user/${userId}`),
    create: (data) => API.post('/reports', data),
    delete: (id) => API.delete(`/reports/${id}`),
};

export const dashboardAPI = {
    get: (userId) => API.get(`/dashboard/${userId}`),
};

export default API;