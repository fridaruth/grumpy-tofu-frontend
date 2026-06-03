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

        // hämta beställningar
        getOrders();
        // hämta meddelanden
        getMessages();

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

// hämta beställningar
async function getOrders() {
    const token = localStorage.getItem('token');
    const ordersList = document.getElementById('admin-orders-list');

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const orders = await response.json();

            if (orders.length === 0) {
                ordersList.innerHTML = '<p>Inga beställningar väntar</p>';
                return;
            }

            ordersList.innerHTML = '';

            orders.forEach(order => {
                // bygg lista av maträtter i beställning
                const itemsHtml = order.items.map(item => `<li>${item.quantity}x ${item.title}</li>`).join('');

                ordersList.innerHTML += `
                <div class="menu-item">
                <div class="menu-item-header">
                <h3 class="highlight-text">Tid: ${order.pickupTime}</h3>
                <div class="dots"></div>
                <span class="price">${order.totalPrice} kr</span>
                </div>
                <p class="description"><strong>Namn:</strong> ${order.customerName}
                <ul class="order-items-list">
                ${itemsHtml}
                </ul>
                <button class="admin-btn" onclick="completeOrder('${order._id}')">Markera som klar</button>
                </div>
                `;
            });
        }
    } catch (error) {
        console.error("Kunde inte hämta beställningar:", error);
    }
}

// funktion för att radera/markera som klar
window.completeOrder = async function (orderId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            getOrders();
        }
    } catch (error) {
        console.error("Kunde inte markera order som klar:", error);
    }
}

// variabler för redigering
let allMenuItems = [];
let editingItemId = null;

// hämta menyn
async function fetchAdminMenu() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        if (!response.ok) throw new Error('Kunde inte hämta menyn');

        allMenuItems = await response.json();
        adminMenuList.innerHTML = '';

        if (allMenuItems.length === 0) {
            adminMenuList.innerHTML = '<p class="loading">Menyn är tom.</p>'
            return;
        }

        // definiera kategorier
        const categories = ['förrätt', 'varmrätt', 'efterrätt', 'dryck'];

        categories.forEach(category => {
            const itemsInCategory = allMenuItems.filter(item => item.category.toLowerCase() === category);

            // visa kategori med maträtter i
            if (itemsInCategory.length > 0) {

                // skapa rubrik
                const categoryHeader = document.createElement('h3');
                categoryHeader.textContent = category;
                categoryHeader.classList.add('category-header');
                adminMenuList.appendChild(categoryHeader);

                // skapa rätter under rubrik
                itemsInCategory.forEach(item => {
                    const adminItem = document.createElement('div');
                    adminItem.classList.add('admin-menu-item');

                    adminItem.innerHTML = `
                    <div class="item-info">
                    <h4>${item.title} (${item.price} kr)</h4>
                    <p>${item.description}</p>
                    </div>

                    <div class="action-btns">
                    <button class="delete-btn" data-id="${item._id}">Ta bort</button>
                    <button class="edit-btn" data-id="${item._id}">Redigera</button>
                    </div>
                    `;

                    // koppla klick till radering
                    adminItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                        const itemId = e.target.getAttribute('data-id');
                        deleteMenuItem(itemId);
                    });

                    // koppla klick till redigering
                    adminItem.querySelector('.edit-btn').addEventListener('click', (e) => {
                        const itemId = e.target.getAttribute('data-id');
                        editMenuItem(itemId);
                    });

                    adminMenuList.appendChild(adminItem);

                });
            }
        });
    } catch (error) {
        adminMenuList.innerHTML = `<p class="error-msg">${error.message}</p>`;
    }
}

// funktion för att fylla formuläret vid redigering
function editMenuItem(id) {
    const itemToEdit = allMenuItems.find(item => item._id === id);
    if (!itemToEdit) return;

    // fyll formulär
    document.getElementById('item-title').value = itemToEdit.title;
    document.getElementById('item-description').value = itemToEdit.description;
    document.getElementById('item-price').value = itemToEdit.price;
    document.getElementById('item-category').value = itemToEdit.category.toLowerCase();

    // sätt tillståndet till redigera
    editingItemId = id;

    // ändra text på rubrik och knapp
    document.querySelector('#view-menu h2').textContent = 'Redigera maträtt';
    document.querySelector('#add-item-form button[type="submit"]').textContent = 'Uppdatera';

    // scrolla upp
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // kolla om vi redigerar en gammal (PUT) eller skapar ny (POST)
    const method = editingItemId ? 'PUT' : 'POST';
    const url = editingItemId ? `${API_BASE_URL}/menu/${editingItemId}` : `${API_BASE_URL}/menu`;

    try {
        const response = await fetch(url, {
            method: method,
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
        formMessage.innerText = editingItemId ? 'Rätten har uppdaterats!' : 'Rätten har sparats!';
        formMessage.style.display = 'block';

        addItemForm.reset(); // töm formulär
        editingItemId = null;
        document.querySelector('#view-menu h2').textContent = 'Lägg till ny maträtt';
        document.querySelector('#add-item-form button[type="submit"]').textContent = 'Spara i menyn';
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

// hämta meddelanden
async function getMessages() {
    const token = localStorage.getItem('token');
    const messageList = document.getElementById('admin-messages-list');

    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const messages = await response.json();

            if (messages.length === 0) {
                messageList.innerHTML = '<p class="empty-msg">Inga meddelanden. Skönt!</p>';
                return;
            }

            messageList.innerHTML = '';

            messages.forEach(msg => {
                const date = new Date(msg.createdAt).toLocaleString('sv-SE');

                messageList.innerHTML += `
                <div class="menu-item">
                <div class="menu-item-header">
                <h3>Från: <a href="mailto:${msg.email}">${msg.name}</a></h3>
                <div class="dots"></div>
                <span class="price">${date}</span>
                </div>
                <h4>Ämne: ${msg.title}</h4>
                <p class="description">"${msg.message}"</p>
                <button class="admin-btn" onclick="deleteMessage('${msg._id}')">Ssssch. Släng bort meddelandet.</button>
                </div>
                `;
            });
        }
    } catch (error) {
        console.error("Kunde inte hämta meddelanden:", error);
    }
}

// funktion för att slänga meddelande
window.deleteMessage = async function (msgId) {
    if (!confirm('Är du säker på att du vill slänga meddelandet?')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${msgId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            getMessages(); 
        }
    } catch (error) {
        console.error("Kunde inte radera meddelandet:", error);
    }
}

// flikar för admin
const tabOrders = document.getElementById('tab-orders');
const tabMenu = document.getElementById('tab-menu');
const tabMessages = document.getElementById('tab-messages');

const viewOrders = document.getElementById('view-orders');
const viewMenu = document.getElementById('view-menu');
const viewMessages = document.getElementById('view-messages');


// funktion för att dölja allt
function hideAllAdminViews() {
    viewOrders.style.display = 'none';
    viewMenu.style.display = 'none';
    viewMessages.style.display = 'none';

    tabOrders.classList.remove('active');
    tabMenu.classList.remove('active');
    tabMessages.classList.remove('active');
}

// klicka på beställningar
tabOrders.addEventListener('click', () => {
    hideAllAdminViews();
    viewOrders.style.display = 'block';
    tabOrders.classList.add('active');
});

// klicka på menyhantering
tabMenu.addEventListener('click', () => {
    hideAllAdminViews();
    viewMenu.style.display = 'block';
    tabMenu.classList.add('active');
})

// klicka på meddelanden
tabMessages.addEventListener('click', () => {
    hideAllAdminViews();
    viewMessages.style.display = 'block';
    tabMessages.classList.add('active');
})

document.addEventListener('DOMContentLoaded', checkAuth);
