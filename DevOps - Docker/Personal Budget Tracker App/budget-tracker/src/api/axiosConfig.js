import axios from 'axios';

export const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    'http://localhost:8080/api';

const API = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
});

API.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        const isAuthRequest =
            /\/auth\/(login|register)$/.test(url) ||
            /\/(login|register)$/.test(url);
        const hasSession = Boolean(localStorage.getItem('budgetUser'));

        if (status === 401 && !isAuthRequest && hasSession) {
            localStorage.removeItem('budgetUser');
            window.location.href = '/login';
        }
        console.error(`[API Error] ${status}: ${error.message}`);
        return Promise.reject(error);
    }
);

const postToFirstAvailable = async (paths, data) => {
    let lastNotFoundError = null;

    for (const path of paths) {
        try {
            return await API.post(path, data);
        } catch (error) {
            if (error.response?.status === 404) {
                lastNotFoundError = error;
                continue;
            }
            throw error;
        }
    }

    throw lastNotFoundError || new Error('No auth endpoint available');
};

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
    const payload = error?.response?.data;
    const message =
        payload?.message ||
        payload?.error ||
        payload?.details ||
        (typeof payload === 'string' ? payload : null);

    if (message) return message;
    if (!error?.response && error?.message && !error?.isAxiosError) return error.message;
    if (!error?.response) {
        return `Cannot reach backend at ${API_BASE_URL}. Start backend or set REACT_APP_API_BASE_URL.`;
    }
    if (error.response.status === 404) {
        return `API route not found at ${API_BASE_URL}${error.config?.url || ''}. Check backend URL/routes.`;
    }
    return fallback;
};

export const authAPI = {
    login: (data) => postToFirstAvailable(['/auth/login', '/login', '/users/login'], data),
    register: (data) => postToFirstAvailable(['/auth/register', '/register', '/users/register'], data)
};

export const userAPI = {
    getAll: () => API.get('/users'),
    getById: (id) => API.get(`/users/${id}`),
    create: (data) => API.post('/users', data),
    update: (id, data) => API.put(`/users/${id}`, data),
    delete: (id) => API.delete(`/users/${id}`)
};

export const accountAPI = {
    getAll: () => API.get('/accounts'),
    getById: (id) => API.get(`/accounts/${id}`),
    getByUser: (userId) => API.get(`/accounts/user/${userId}`),
    getBalance: (userId) => API.get(`/accounts/user/${userId}/balance`),
    create: (data) => API.post('/accounts', data),
    update: (id, data) => API.put(`/accounts/${id}`, data),
    delete: (id) => API.delete(`/accounts/${id}`)
};

export const categoryAPI = {
    getAll: () => API.get('/categories'),
    getById: (id) => API.get(`/categories/${id}`),
    getForUser: (userId) => API.get(`/categories/user/${userId}`),
    getByType: (type) => API.get(`/categories/type/${type}`),
    create: (data) => API.post('/categories', data),
    update: (id, data) => API.put(`/categories/${id}`, data),
    delete: (id) => API.delete(`/categories/${id}`)
};

export const incomeAPI = {
    getAll: () => API.get('/incomes'),
    getById: (id) => API.get(`/incomes/${id}`),
    getByUser: (userId) => API.get(`/incomes/user/${userId}`),
    getTotal: (userId) => API.get(`/incomes/user/${userId}/total`),
    create: (data) => API.post('/incomes', data),
    update: (id, data) => API.put(`/incomes/${id}`, data),
    delete: (id) => API.delete(`/incomes/${id}`)
};

export const expenseAPI = {
    getAll: () => API.get('/expenses'),
    getById: (id) => API.get(`/expenses/${id}`),
    getByUser: (userId) => API.get(`/expenses/user/${userId}`),
    getTotal: (userId) => API.get(`/expenses/user/${userId}/total`),
    getByCategory: (userId) => API.get(`/expenses/user/${userId}/by-category`),
    create: (data) => API.post('/expenses', data),
    update: (id, data) => API.put(`/expenses/${id}`, data),
    delete: (id) => API.delete(`/expenses/${id}`)
};

export const goalAPI = {
    getAll: () => API.get('/goals'),
    getById: (id) => API.get(`/goals/${id}`),
    getByUser: (userId) => API.get(`/goals/user/${userId}`),
    getActive: (userId) => API.get(`/goals/user/${userId}/active`),
    create: (data) => API.post('/goals', data),
    update: (id, data) => API.put(`/goals/${id}`, data),
    contribute: (id, amount) => API.patch(`/goals/${id}/contribute?amount=${amount}`),
    delete: (id) => API.delete(`/goals/${id}`)
};

export const transferAPI = {
    getAll: () => API.get('/transfers'),
    getById: (id) => API.get(`/transfers/${id}`),
    getByUser: (userId) => API.get(`/transfers/user/${userId}`),
    create: (data) => API.post('/transfers', data),
    delete: (id) => API.delete(`/transfers/${id}`)
};

export const recurringAPI = {
    getAll: () => API.get('/recurring'),
    getById: (id) => API.get(`/recurring/${id}`),
    getByUser: (userId) => API.get(`/recurring/user/${userId}`),
    getActive: (userId) => API.get(`/recurring/user/${userId}/active`),
    create: (data) => API.post('/recurring', data),
    update: (id, data) => API.put(`/recurring/${id}`, data),
    delete: (id) => API.delete(`/recurring/${id}`)
};

export const alertAPI = {
    getAll: () => API.get('/alerts'),
    getByUser: (userId) => API.get(`/alerts/user/${userId}`),
    getUnread: (userId) => API.get(`/alerts/user/${userId}/unread`),
    getUnreadCount: (userId) => API.get(`/alerts/user/${userId}/unread/count`),
    markRead: (id) => API.patch(`/alerts/${id}/read`),
    create: (data) => API.post('/alerts', data),
    delete: (id) => API.delete(`/alerts/${id}`)
};

export const budgetAPI = {
    getAll: () => API.get('/budgets'),
    getById: (id) => API.get(`/budgets/${id}`),
    getByUser: (userId) => API.get(`/budgets/user/${userId}`),
    getByMonth: (userId, month) => API.get(`/budgets/user/${userId}/month/${month}`),
    create: (data) => API.post('/budgets', data),
    update: (id, data) => API.put(`/budgets/${id}`, data),
    delete: (id) => API.delete(`/budgets/${id}`)
};

export const reportAPI = {
    getAll: () => API.get('/reports'),
    getByUser: (userId) => API.get(`/reports/user/${userId}`),
    create: (data) => API.post('/reports', data),
    delete: (id) => API.delete(`/reports/${id}`)
};

export const dashboardAPI = {
    get: (userId) => API.get(`/dashboard/${userId}`)
};

export const aiAssistantAPI = {
    ask: (data) =>
        postToFirstAvailable(
            ['/ai/assistant/chat', '/ai/chat', '/assistant/chat', '/assistant/ask'],
            data
        )
};

export default API;
