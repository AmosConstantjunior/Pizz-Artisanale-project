import { db } from './init.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const tabList = document.getElementById("myCommande");
const tabContent = document.querySelector(".tab-content");

function encodeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function createTabButton(id, isActive) {
  return `
    <li class="nav-item" role="presentation">
      <button class="nav-link ${isActive ? 'active' : ''}" id="${id}-tab" data-bs-toggle="tab"
        data-bs-target="#${id}" type="button" role="tab" aria-controls="${id}"
        aria-selected="${isActive}">${id.charAt(0).toUpperCase() + id.slice(1)}</button>
    </li>
  `;
}

function createTabPane(id, isActive) {
  return `
    <div class="tab-pane fade ${isActive ? 'show active' : ''}" id="${id}" role="tabpanel" aria-labelledby="${id}-tab">
      <div class="menu-wrapper d-flex flex-wrap gap-3 p-3" id="menu-${id}"></div>
    </div>
  `;
}

function createPizzaCard(pizza) {
  return `
    <div class="menu-card"
    data-toggle="modal" data-target="#myModal"
         data-name="${encodeHTML(pizza.name)}"
         data-image="${encodeHTML(pizza.image)}"
         data-price="${pizza.price}"
         data-description="${encodeHTML(pizza.description || '')}"
         data-ingredients='${encodeHTML(JSON.stringify(pizza.ingredients || []))}'
         style="cursor:pointer">
      <img src="${pizza.image}" alt="${pizza.name}" class="menu-image" />
      <div class="menu-rating">${'★'.repeat(pizza.rating || 5)}</div>
      <div class="menu-title">${pizza.name}</div>
      <div class="menu-price">${pizza.price.toFixed(2)} €</div>
    </div>
  `;
}


function showPizzaInModal(pizza) {
  document.getElementById("modal-pizza-name").textContent = pizza.name;
  document.getElementById("modal-pizza-image").src = pizza.image;
  document.getElementById("modal-dish-title").textContent = pizza.name;
  document.getElementById("modal-dish-description").textContent = pizza.description || "Aucune description.";
  document.getElementById("modal-dish-price").textContent = `${pizza.price.toFixed(2)} €`;

  const ingredientsContainer = document.getElementById("modal-ingredients");
  ingredientsContainer.innerHTML = '';
  if (Array.isArray(pizza.ingredients)) {
    pizza.ingredients.forEach(ingredient => {
      ingredientsContainer.insertAdjacentHTML('beforeend', `
        <div class="ingredient text-center">
          <img src="${ingredient.image}" alt="${ingredient.name}" class="ingredient-img">
          <div class="ingredient-label">${ingredient.name}</div>
        </div>
      `);
    });
  }

  const modal = new bootstrap.Modal(document.getElementById('myModal'));
  modal.show();
}

async function loadDynamicTabsAndPizzas() {
  try {
    const snapshot = await getDocs(collection(db, "pizzas"));
    const pizzasByCategory = {};

    snapshot.forEach(doc => {
      const pizza = doc.data();
      if (!pizza.categorie) return;

      if (!pizzasByCategory[pizza.categorie]) {
        pizzasByCategory[pizza.categorie] = [];
      }
      pizzasByCategory[pizza.categorie].push(pizza);
    });

    const categories = Object.keys(pizzasByCategory);

    if (categories.length === 0) {
      tabContent.innerHTML = '<p class="text-center p-4">Aucune pizza trouvée 😢</p>';
      return;
    }

    tabList.innerHTML = '';
    tabContent.innerHTML = '';

    categories.forEach((cat, index) => {
      const isActive = index === 0; // Le premier onglet est actif par défaut
      tabList.insertAdjacentHTML('beforeend', createTabButton(cat, isActive));
      tabContent.insertAdjacentHTML('beforeend', createTabPane(cat, isActive));

      const wrapper = document.getElementById(`menu-${cat}`);
      pizzasByCategory[cat].forEach(pizza => {
        wrapper.insertAdjacentHTML('beforeend', createPizzaCard(pizza));
      });
    });

    // 🎯 Ajouter un écouteur d'événements pour gérer les changements d'onglets
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        const targetTabId = this.getAttribute('data-bs-target').slice(1); // Extraire l'ID de l'onglet cible
        const activeTabPane = document.querySelector('.tab-pane.show.active');
        const activeTabButton = document.querySelector('.nav-link.active');

        if (activeTabPane) {
          activeTabPane.classList.remove('show', 'active'); // Désactiver l'onglet précédent
        }

        if (activeTabButton) {
          activeTabButton.classList.remove('active'); // Désactiver le bouton précédent
        }

        // Activer le nouvel onglet
        document.getElementById(targetTabId).classList.add('show', 'active');
        this.classList.add('active');
      });
    });

    // 🎯 Ajoute les événements de clics sur chaque carte pizza
    document.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => {
        try {
          const pizza = {
            name: card.dataset.name,
            image: card.dataset.image,
            price: parseFloat(card.dataset.price),
            description: card.dataset.description,
            ingredients: JSON.parse(card.dataset.ingredients)
          };
          showPizzaInModal(pizza);
        } catch (err) {
          console.error("Erreur de parsing de carte pizza:", err);
        }
      });
    });


  } catch (error) {
    console.error("Erreur:", error);
    tabContent.innerHTML = '<div class="alert alert-danger">Erreur de chargement</div>';
  }
}
async function loadGalleryImages() {
  const galleryContainer = document.querySelector(".gallery");
  if (!galleryContainer) {
    console.warn("⚠️ Aucune div .gallery trouvée dans le DOM.");
    return;
  }

  try {
    const q = query(
      collection(db, "pizzaria_photos"),
      limit(4)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      galleryContainer.innerHTML = '<p class="text-center text-muted">Aucune image disponible.</p>';
      return;
    }

    galleryContainer.innerHTML = ''; // Clear existing placeholders

    snapshot.forEach(doc => {
      const data = doc.data();

      // Correction ici : assure-toi que le champ s'appelle bien `imageUrl` dans Firestore
      const imageUrl = data.imageUrl || data.url; // sécurité au cas où

      if (imageUrl) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = data.alt || "Photo pizzaria";
        img.loading = "lazy";
        img.style.width = "300px";
        img.style.height = "300px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "12px";
        img.style.margin = "8px";
        galleryContainer.appendChild(img);
      }
    });
  } catch (err) {
    console.error("Erreur lors du chargement des images:", err);
    galleryContainer.innerHTML = '<p class="text-danger">Erreur de chargement des images.</p>';
  }
}

async function loadGalleryModalImages() {
  const container = document.getElementById("galleryModalContainer");
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, "pizzaria_photos"));
    const photos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const imageUrl = data.imageUrl || data.url;
      if (imageUrl) photos.push(imageUrl);
    });

    // Garde uniquement les 12 plus récentes
    const latestPhotos = photos.slice(-12).reverse();

    container.innerHTML = '';
    latestPhotos.forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Photo Pizzaria";
      img.loading = "lazy";
      img.width = 300;
      img.height = 300;
      img.style.objectFit = "cover";
      img.className = "rounded shadow";
      container.appendChild(img);
    });

  } catch (err) {
    console.error("Erreur chargement galerie:", err);
    container.innerHTML = '<p class="text-danger">Erreur lors du chargement des images.</p>';
  }
}


async function loadBlogPosts() {
  const blogContainer = document.querySelector(".blog-grid");
  const modalContainer = document.getElementById("blogAllListes");

  if (!blogContainer || !modalContainer) {
    console.warn("⛔ Conteneur blog non trouvé.");
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "blogs")); // Assure-toi que la collection s'appelle bien "blogs"

    if (snapshot.empty) {
      blogContainer.innerHTML = '<p>Aucun blog disponible.</p>';
      modalContainer.innerHTML = '<p>Aucun blog disponible.</p>';
      return;
    }

    blogContainer.innerHTML = "";
    modalContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.publishedAt?.toDate?.(); // Si Timestamp Firestore
      const day = date ? date.getDate().toString().padStart(2, "0") : "--";
      const month = date
        ? date.toLocaleString("fr-FR", { month: "short" })
        : "--";

    const blogHTML = `
  <div class="blog-wrapper" style="flex: 1 1 300px; max-width: 320px;">
    <a href="/Pages/blog-detail.html?id=${doc.id}" style="text-decoration: none; color: inherit;">
      <article class="blog-card">
        <div class="blog-date">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
        <img src="${data.imageUrl || "./placeholder.jpg"}" 
             alt="Blog image"
             style="object-fit: cover; width: 100%; height: 220px;" />
        <div class="blog-content">
          <span class="category">${data.category || "Blog"}</span>
          <h3>${data.title || "Titre manquant"}</h3>
          <div class="meta">🧑 ${data.comments || 0} Commentaires <span class="arrow">↗</span></div>
        </div>
      </article>
    </a>
  </div>
`;

      // Affiche dans la section visible
      if (blogContainer.children.length < 3) {
        blogContainer.insertAdjacentHTML("beforeend", blogHTML);
      }

      // Affiche dans le modal
      modalContainer.insertAdjacentHTML("beforeend", blogHTML);
    });
  } catch (error) {
    console.error("Erreur de chargement des blogs :", error);
    blogContainer.innerHTML = '<p class="text-danger">Erreur de chargement.</p>';
    modalContainer.innerHTML = '<p class="text-danger">Erreur de chargement.</p>';
  }
}


async function loadDesserts() {
  try {
        const dessertRef = await collection(db, "desserts"); // Assure-toi que la collection s'appelle bien "blogs"

    const q = query(dessertRef,limit(5));
  

    const querySnapshot = await getDocs(q);
    const container = document.getElementById("dessertMenuList");
    container.innerHTML = ""; // Vider si besoin

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const itemHTML = `
        <div class="menu-item-pizza-du-jour">
          <div class="text">
            <h2>${data.name || "Nom manquant"}</h2>
      <p>${data.description ? (data.description.length > 20 ? data.description.slice(0, 20) + "..." : data.description) : "Pas de description"}</p>
          </div>
          <div class="price">${data.price ? `${data.price} €` : "Prix ?"}</div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", itemHTML);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des desserts :", error);
  }
}
// Appeler la fonction après chargement DOM

async function loadBoissons() {
  const boissonsRef = collection(db, "boissons");

  try {
    const querySnapshot = await getDocs(boissonsRef);
    const container = document.querySelector("#list-boisson .menu-wrapper");

    // Vide d'abord le contenu existant
    container.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      const card = `
        <div class="menu-card">
          <img src="${data.imageUrl || './placeholder.jpg'}"
               alt="${data.name || 'Boisson'}" class="menu-image" />
          <div class="menu-rating">★★★★★</div>
          <div class="menu-title">${data.name || "Boisson inconnue"}</div>
          <div class="menu-price">${data.price ? `${data.price} €` : "Prix ?"}</div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", card);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des boissons :", error);
  }
}

async function loadTestimonials() {
  const testimonialsRef = collection(db, "reviews"); // nom de ta collection Firestore
  const container = document.querySelector(".testimonials-grid");

  if (!container) {
    console.error("Le conteneur .testimonials-grid est introuvable !");
    return;
  }

  container.innerHTML = ""; // vider le contenu actuel

  try {
    const querySnapshot = await getDocs(testimonialsRef);

    const allReviews = querySnapshot.docs.map(doc => doc.data());
console.log(allReviews);
    // Tirer 3 avis aléatoires
    function getRandomItems(arr, n) {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n);
    }

    const randomReviews = getRandomItems(allReviews, 3);

    randomReviews.forEach((data, index) => {
      const dateObj = data.date ? new Date(data.date.seconds * 1000) : new Date();
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      const imageUrl = data.imageUrl || "https://i.pinimg.com/1200x/6e/59/95/6e599501252c23bcf02658617b29c894.jpg";

      // Id unique pour chaque texte afin de cibler le bouton
      const textId = `testimonial-text-${index}`;
      const btnId = `testimonial-btn-${index}`;

      const cardHTML = `
        <div class="testimonial-card">
          <div class="testimonial-header">
            <img class="testimonial-image" src="${imageUrl}" alt="${data.author || "Client"}">
            <div class="testimonial-author">
              <h3>${data.author || "Anonyme"}</h3>
              <p>${data.clientType || "Client"}</p>
            </div>
          </div>
          <div class="rating">${data.rating ? data.rating.toFixed(1) : "N/A"}</div>
          <p class="testimonial-text" id="${textId}" style="
            max-height: 4.5em; /* environ 3 lignes */
            overflow: hidden;
            position: relative;
            transition: max-height 0.3s ease;
          ">
            ${data.comment || ""}
          </p>
          <button id="${btnId}" style="
            background: none;
            border: none;
            color: blue;
            cursor: pointer;
            padding: 0;
            font-size: 0.9em;
            margin-bottom: 8px;
          ">Voir plus</button>
          <div class="testimonial-date">${formattedDate}</div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", cardHTML);

      // Après insertion dans le DOM, gérer le clic du bouton "Voir plus"
      const textEl = document.getElementById(textId);
      const btnEl = document.getElementById(btnId);

      // Si le texte est déjà court, cacher le bouton
      if (textEl.scrollHeight <= textEl.clientHeight) {
        btnEl.style.display = "none";
      }

      btnEl.addEventListener("click", () => {
        if (btnEl.textContent === "Voir plus") {
          textEl.style.maxHeight = textEl.scrollHeight + "px";
          btnEl.textContent = "Voir moins";
        } else {
          textEl.style.maxHeight = "4.5em";
          btnEl.textContent = "Voir plus";
        }
      });
    });

  } catch (error) {
    console.error("Erreur lors du chargement des avis :", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDynamicTabsAndPizzas();
  loadGalleryImages();
  loadGalleryModalImages();
  loadBlogPosts();
  loadDesserts();
  loadBoissons();
  loadTestimonials();



});

