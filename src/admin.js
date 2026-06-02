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

// hämta menyn
async function fetchAdminMenu() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        if (!response.ok) throw new Error('Kunde inte hämta menyn');

        const menuItems = await response.json();
        adminMenuList.innerHTML = '';

        if (menuItems === 0) {
            adminMenuList.innerHTML = '<p class="loading">Menyn är tom.</p>'
            return;
        }

        menuItems.forEach(item => {
            const adminItem = document.createElement('div');
            adminItem.classList.add('admin-menu-item');

            adminItem.innerHTML = `
            <div class="item-info">
            <h4>${item.title} (${item.price} kr)</h4>
            <p>Kategori: ${item.category} | ${item.description}</p>
            </div>
            <button class="delete-btn" data-id="${item._id}">Ta bort</button>
            `;

            // koppla klick till radera-knapp
            adminItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                const itemId = e.target.gettAttribute('data-id');
                deleteMenuItem(itemId);
            });

            adminMenuList.appendChild(adminItem);
        });
    } catch (error) {
        adminMenuList.innerHTML = `<p class="error-msg">${error.message}</p>`;
    }
}

// lägg till maträtt
addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMessage.style.display = 'none';

    const token = localStorage.getItem('token');

    const title = document.getElementById('item-title').value;
    const description = document.getElementById('item-description').value;
    const price = document.getElementById('item-price').value;
    const category = document.getElementById('item-category').value;

    try {
        const response = await fetch(`${API_BASE_URL}/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, price, category })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kunde inte spara rätten');
        }

        // Visa meddelande vid lyckad tilläggning
        formMessage.innerText = 'Rätten har sparats!';
        formMessage.style.display = 'block';

        addItemForm.reset(); // töm formulär
        fetchAdminMenu(); // ladda om listan med nya maträtten tillagd

    } catch (error) {
        formMessage.innerText = error.message;
        formMessage.style.color = '#d94b36';
        formMessage.style.display = 'block';
    }
});

// radera en maträtt
async function deleteMenuItem(id) {
    // fråga först så man inte råkar ta bort av misstag
    if (!confirm('Är du säker på att du vill ta bort den här rätten från menyn?')) return;
    
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}` // kräver token för att få radera
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kunde inte radera rätten');
        }

        fetchAdminMenu(); // ladda om listan
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', checkAuth);