const AUTH_KEY = 'token';
const USER_KEY = 'user';

// Get Token
function getToken() {
    return localStorage.getItem(AUTH_KEY);
}

// Get User Object
function getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

// Check if Logged In
function isLoggedIn() {
    const token = getToken();
    
    return !!token;
}

// Logout
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/index.html';
}

// Check Auth & Role on Page Load
function checkAuth(allowedRoles = []) {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        logout(); // Redirect to login
        return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {

        alert('غير مصرح لك بدخول هذه الصفحة');
        logout(); 
        return;
    }

    // Enhance UI: Show User Name if element exists
    const userNameEl = document.getElementById('navbar-username');
    if (userNameEl) {
        userNameEl.innerText = user.name;
    }
}

// Secured Fetch Wrapper
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    
    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);

       

        if (response.status === 401) {
  logout();
}

if (response.status === 403) {
  alert("غير مسموح لك تنفيذ الإجراء ده");
  return;
}






        return response;
    } catch (error) {
        console.error('API Request Failed', error);
        throw error;
    }
}

// Make functions globally available
window.auth = {
    getToken,
    getUser,
    isLoggedIn,
    logout,
    checkAuth,
    fetchWithAuth
};
