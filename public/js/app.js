// Utility file for fetching and auth handling

const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    return {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('userName'),
        role: localStorage.getItem('role')
    };
}

function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

function checkAuth(requiredRole = null) {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }

    if (requiredRole && localStorage.getItem('role') !== requiredRole) {
        // Redirect if wrong role
        if (localStorage.getItem('role') === 'admin') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/index.html';
        }
        return false;
    }
    return true;
}

// Wrapper for Fetch API adding Auth headers globally
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const config = {
        ...options,
        headers
    };

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await res.json();

        if (!res.ok) {
            // Handle unauthorized globally
            if (res.status === 401 && endpoint !== '/auth/login') {
                logout();
            }
            throw new Error(data.message || 'API request failed');
        }
        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
