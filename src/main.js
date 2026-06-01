import './style.scss'

// adress till backend
const API_URL = 'http://localhost:3000/api/menu';

// hämta menyn från API
async function fetchMenu() {
  const menuContainer = document.getElementById('menu-container');

  try {
    const response = await fetch(API_URL);

    // kolla om anropet gått bra
    if (!response.ok) {
      throw new Error('Kunde inte hämta menyn :(');
    }

    const menuItems = await response.json();

    // rensa laddar menyn-texten
    menuContainer.innerHTML = '';

    // om menyn är helt tom
    if (menuItems.length === 0) {
      menuContainer.innerHTML = '<p class="loading">Menyn är tyvärr tom just nu. Kocken vilar..</p>';
      return;
    }

    // loopa igenom maträtter för att bygga HTML
    menuItems.forEach(item => {
      const menuItemElement = document.createElement('div');
      menuItemElement.classList.add('menu-item');

      menuItemElement.innerHTML = `
      <div class="menu-item-header">
      <h3>${item.title}</h3>
      <div class="dots"></div>
      <span class="price">${item.price} kr</span>
      </div>
      <p class="description">${item.description}</p>
      <span class="category">${item.category}</span>
      `;

      menuContainer.appendChild(menuItemElement);
    });
  } catch (error) {
    console.error('Fel vid hämtning av meny:', error);
    menuContainer.innerHTML = `
    <p class="loading" style="color: #d94b36;">
  Hoppsan! Det gick inte att ansulta till köket. Se till att backend-servern är igång.
  </p>
  `;
  }
}

document.addEventListener('DOMContentLoaded', fetchMenu);