import ''

// adress till backend
const API_URL = 'http://localhost:3000/api/menu';

// hämta menyn från API
async function fetchMenu() {
  const loadingText = document.getElementById('menu-loading');

  try {
    const response = await fetch(API_URL);

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