import './style.scss';

// Api-adress
const API_BASE_URL = 'http://localhost:3000/api';

// hämta HTML-element
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loggedInUserSpan = document.getElementById('logged-in-user');
const logoutBtn = document.getElementById('logout-btn');

const addItemForm = document.getElementById('add-item-form');
const formMessage = document.getElementById('form-message');
const adminMenuList = document.getElementById('admin-menu-list');

// kolla inloggningsstatus när sidan laddas
function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
        // om token finns, göm inloggning och visa instrumentpanel
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loggedInUserSpan.innerText = username;

        // hämta menyn till adminlistan
        fetchAdminMenu();
    } else {
        // om ingen token finns, visa inloggning
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }
}

// logga in personal
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // göm gamla felmeddelanden
    loginError.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Inloggningen misslyckades');
        }

        // sparandet lyckades! spara token och användarnamn
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);

        // nollställ formulär och uppdatera vyn
        loginForm.reset();
        checkAuth();
    } catch (error) {
        loginError.innerText = error.message;
        loginError.style.display = 'block';
    }
});

// logga ut
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    checkAuth();
});