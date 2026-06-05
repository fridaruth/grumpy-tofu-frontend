# Projektuppgift - Grumpy Tofu (Frontend)
Detta är frontend-delen av min projektuppgift i kursen Backend-baserad webbutveckling. 
Projektet gick ut på att bygga en webbplats för den fiktiva restaurangen "Grumpy Tofu". Den består av en publik kundsida där besökare kan se menyn och beställa mat, samt en inloggninsskyddad admin-panel där personal kan hantera menyn samt se inkommande beställningar och meddelanden. 

[Länk till publicerad sida](https://grumpytofu.netlify.app/)

### Funktioner
* **Publik meny och varukorg:** Kunde kan bläddra i menyn, lägga till rätter i en varukorg och skicka beställningar med en vald hämtningstid.
* **Skyddad Admin-panel:** Säker inloggning för personal som hanteras via JWT.
* **CRUD för menyn:** Inloggad personal kan lägga till, redigera och ta bort maträtter direkt i gränssnittet.
* **Handritad design:** Gränssnittet använder asymmetriska ramar och ojämna linjer via SCSS för att ge en handskissad känsla.

### Verktyg
* **Språk:** HTML5 & Vanilla JavaScript
* **Styling:** SCSS med variabler och komponenter
* **Nätverk:** Fetch API för all kommunikation med backend-servern