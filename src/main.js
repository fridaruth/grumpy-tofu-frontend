"use strict";
import './style.scss';

// adress till backend
const API_BASE_URL = 'https://projekt-tofu-api.onrender.com/api';

// bygg öppettider för beställningar (11:00 - 21:00)
function generateTimeOptions() {
  const timeSelect = document.getElementById('order-time');
  if (!timeSelect) return;

  // loopa igenom från 11 till 20
  for (let hour = 11; hour <= 20; hour++) {
    // för varje timme, loopa igenom kvarter
    for (let minute of ['00', '15', '30', '45']) {
      const timeString = `${hour}:${minute}`;
      timeSelect.innerHTML += `<option value="${timeString}">${timeString}</option>`;
    }
  }
}

// kör funktionen direkt när sidan startar
document.addEventListener('DOMContentLoaded', generateTimeOptions);

// hämta menyn från API
async function fetchMenu() {
  const loadingText = document.getElementById('menu-loading');

  try {
    const response = await fetch(`${API_BASE_URL}/menu`);

    // kolla om anropet gått bra
    if (!response.ok) {
      throw new Error('Kunde inte hämta menyn :(');
    }

    const menuItems = await response.json();

    // rensa laddar menyn-texten
    loadingText.innerHTML = '';

    // om menyn är helt tom
    if (menuItems.length === 0) {
      loadingText.innerHTML = '<p class="loading">Menyn är tyvärr tom just nu. Kocken vilar..</p>';
      loadingText.style.display = 'block';
      return;
    }

    // loopa igenom maträtter för att bygga HTML
    menuItems.forEach(item => {
      // gör om kategorinamnet
      const itemCategory = item.category.toLowerCase();

      // hitta rätt kategoriblock
      const categoryBlock = document.getElementById(`cat-${itemCategory}`);

      if (categoryBlock) {
        categoryBlock.style.display = 'block';

        // hitta listan
        const menuList = categoryBlock.querySelector('.menu-list')


        const menuItemElement = document.createElement('div');
        menuItemElement.classList.add('menu-item');

        menuItemElement.innerHTML = `
      <div class="menu-item-header">
      <h3>${item.title}</h3>
      <div class="dots"></div>
      <span class="price">${item.price} kr</span>
      </div>
      <p class="description">${item.description}</p>
      <button class="add-to-cart-btn" data-title="${item.title}" data-price="${item.price}">+ Lägg till</button>
      `;

        menuList.appendChild(menuItemElement);
      }
    });

  } catch (error) {
    console.error('Fel vid hämtning av meny:', error);
    loadingText.innerHTML = 'Hoppsan! Det gick inte att ansulta till köket. Se till att backend-servern är igång.';
    loadingText.classList.add('error-message');
    loadingText.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', fetchMenu);

// beställningar
// array för att spara rätter
let cart = [];

// lyssna efter klcik på "lägg till"-knappar
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('add-to-cart-btn')) {
    const title = e.target.getAttribute('data-title');
    const price = Number(e.target.getAttribute('data-price'));
    addToCart(title, price);

    const btn = e.target;
    const originalText = btn.textContent;

    btn.textContent = 'Tillagd! ✓';
    btn.classList.add('added-feedback');

    // ta bort efter 2 sekunder
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('added-feedback');
    }, 1500);
  }
});

// funktion för att lägga till i varukorg
function addToCart(title, price) {
  // kolla om rätten redan finns
  const existingItem = cart.find(item => item.title === title);
  if (existingItem) {
    existingItem.quantity += 1; // öka antal
  } else {
    cart.push({ title, price, quantity: 1 }); // lägg till ny
  }
  updateCartUI(); // uppdatera varukorg
}

// funktion för att rita ut varukorg
function updateCartUI() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const orderForm = document.getElementById('order-form');

  // om varukorgen är tom
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Din varukorg är tom! Lägg till något från menyn</p>';
    cartTotalPrice.textContent = '0';
    orderForm.style.display = 'none';
    return;
  }

  // töm behållaren
  cartItemsContainer.innerHTML = '';
  let total = 0;

  // skriv ut varje rätt
  cart.forEach(item => {
    total += item.price * item.quantity;
    cartItemsContainer.innerHTML += `
    <div class="cart-item-row">
    <span>${item.quantity}x ${item.title}</span>
    <span>${item.price * item.quantity} kr</span>
    </div>
    `
  });

  // uppdatera totalsumma
  cartTotalPrice.textContent = total;
  orderForm.style.display = 'block';
}

// hantera beställningsformulär
const orderForm = document.getElementById('order-form');

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // bygg objektet
  const orderData = {
    customerName: document.getElementById('order-name').value,
    customerPhone: document.getElementById('order-phone').value,
    pickupTime: document.getElementById('order-time').value,
    items: cart,
    totalPrice: total
  };

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      // beställning gick igenom
      const messageEl = document.getElementById('order-message');
      messageEl.textContent = 'Tack för din beställning!';
      messageEl.style.display = 'block';

      // Töm varukorg och rensa
      cart = [];
      updateCartUI();
      orderForm.reset();

      // göm meddelandet efter 5 sekunder
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    } else {
      console.error("Något gick fel med beställningen..");
    }
  } catch (error) {
    console.error("Serverfel:", error);
  }
});

// fliksystem för kunder
const navMenu = document.getElementById('nav-menu');
const navAbout = document.getElementById('nav-about');
const navContact = document.getElementById('nav-contact');

const viewMenu = document.getElementById('view-menu');
const viewAbout = document.getElementById('view-about');
const viewContact = document.getElementById('view-contact');

// funktion för att dölja vyer och stänga av knappar
function hideAllViews() {
  viewMenu.style.display = 'none';
  viewAbout.style.display = 'none';
  viewContact.style.display = 'none';

  navMenu.classList.remove('active');
  navAbout.classList.remove('active');
  navContact.classList.remove('active');
}

// lyssna på klick
navMenu.addEventListener('click', () => {
  hideAllViews();
  viewMenu.style.display = 'block';
  navMenu.classList.add('active');
});

navAbout.addEventListener('click', () => {
  hideAllViews();
  viewAbout.style.display = 'block';
  navAbout.classList.add('active');
});

navContact.addEventListener('click', () => {
  hideAllViews();
  viewContact.style.display = 'block';
  navContact.classList.add('active');
})

// kontaktformulär
const contactForm = document.getElementById('contact-form');
const contactMessage = document.getElementById('contact-message');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const title = document.getElementById('title').value;
  const message = document.getElementById('message').value;

  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, title, message })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backenden vill inte spara! Anledning:", errorData);
      return;
    }
  } catch (error) {
    console.error("Kunde inte prata med backenden alls:", error);
    return;
  }

  // visa meddelande när formulär är skickat
  contactMessage.innerHTML = "Skickat.. tack för ditt meddelande. Vi får se om vi återkommer."
  contactMessage.style.display = "block";

  contactForm.reset();
});