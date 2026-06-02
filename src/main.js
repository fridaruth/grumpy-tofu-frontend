import './style.scss';

// adress till backend
const API_BASE_URL = 'http://localhost:3000/api';

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
    loadingText.style.color = '#d94b35';
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
    cartItemsContainer.innerHTML = '<p class="empty-cart-msg" style="font-style: italic; color: #666;">Din varukorg är tom! Lägg till något från menyn</p>';
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
      messageEl.textContent = 'Tack för beställningen! Din mat väntar på dig.';
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