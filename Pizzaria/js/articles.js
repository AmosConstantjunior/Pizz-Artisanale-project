// Importation de Firestore pour récupérer les données
import { db } from './init.js';
import { collection, getDoc, query, orderBy, limit, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



function formatTextToParagraphs(text) {
    // Nettoie les retours à la ligne et divise par les points
    const paragraphs = text.split(/\n\n|\.\s+/); // divise par double saut de ligne ou point

    // Filtrer les morceaux vides et créer des <p>
    return paragraphs
        .filter(p => p.trim() !== "")
        .map(p => `<p>${p.trim()}.</p>`) // remet le point à la fin
        .join("\n");
}

// Fonction pour charger l'article depuis Firebase en utilisant l'ID passé dans l'URL
async function loadBlogArticle() {
    const params = new URLSearchParams(window.location.search); // Récupère les paramètres de l'URL
    const blogId = params.get("id"); // Récupère l'ID de l'article dans l'URL
    if (!blogId) {
        console.warn("Aucun ID d'article trouvé dans l'URL.");
        return;
    }

    try {
        // Référence au document spécifique dans Firestore (collection 'blogs')
        const docRef = doc(db, "blogs", blogId);
        const docSnap = await getDoc(docRef); // Récupérer le document

        if (!docSnap.exists()) {
            console.warn("Aucun article correspondant trouvé.");
            return;
        }

        const data = docSnap.data();
        console.log("Blog ID:", data); // Affiche l'ID de l'article dans la console pour le débogage

        // Afficher les données dans les éléments HTML
        document.querySelector(".article-title").textContent = data.title || "Titre manquant";

        const imageBlog = document.getElementById("blog-detait-couverture");

        // document.querySelector(".article-image").src = data.imageUrl || "./placeholder.jpg"; // Image avec un fallback


        const imageUrl = data.imageUrl || data.url; // sécurité au cas où

        if (imageUrl) {
            const img = document.createElement("img");
            img.src = imageUrl;
            img.loading = "lazy";
            img.style.width = "100%";
            img.style.maxHeight = "220px"; // Limite la hauteur de l'image
            img.style.objectFit = "cover";
            img.style.borderRadius = "12px";
            img.style.margin = "8px";
            img.style.display = "block";
            imageBlog.appendChild(img);

        }
        // Formater la date de publication (Timestamp)
        if (data.publishedAt) {
            const date = new Date(data.publishedAt.seconds * 1000); // Convertir le timestamp en date
            document.querySelector(".article-date").textContent = date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        }
        const rawContent = data.content || "";
        const paragraphs = rawContent.split('\n').filter(p => p.trim() !== "");

        const contentContainer = document.querySelector(".article-content");
        contentContainer.innerHTML = ""; // Clear previous content

        paragraphs.forEach(p => {
            const paragraphElement = document.createElement("p");
            paragraphElement.textContent = p;
            paragraphElement.style.marginBottom = "1em"; // spacing
            contentContainer.appendChild(paragraphElement);
        });

    } catch (error) {
        console.error("Erreur lors du chargement de l'article :", error);
    }
}

// Charger l'article une fois la page prête
document.addEventListener("DOMContentLoaded", function () {
    loadBlogArticle();
});
