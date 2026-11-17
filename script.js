// Mini-libreria — Settimana VII Giorno I — Versione con localStorage

// === Classi ===
class Libro {
  static contatore = 0;

  constructor(titolo, autore, anno) {
    this.id = ++Libro.contatore;
    this.titolo = titolo;
    this.autore = autore;
    this.anno = anno;
    this.letto = false;
  }

  segnaComeLetto() {
    this.letto = true;
  }

  formato() {
    return "cartaceo";
  }
}

class LibroDigitale extends Libro {
  constructor(titolo, autore, anno, dimensioneMb) {
    super(titolo, autore, anno);
    this.dimensioneMb = dimensioneMb;
  }

  formato() {
    return `digitale (${this.dimensioneMb} MB)`;
  }
}

// === LocalStorage ===
const CHIAVE_LIBRI = "mini-libreria-libri";

function caricaLibri() {
  try {
    const dati = JSON.parse(localStorage.getItem(CHIAVE_LIBRI) || "[]");

    if (!Array.isArray(dati)) {
      return [];
    }

    const libriCaricati = dati.map((d) => {
      const libro =
        d.tipo === "digitale"
          ? new LibroDigitale(d.titolo, d.autore, d.anno, d.dimensioneMb)
          : new Libro(d.titolo, d.autore, d.anno);

      libro.id = Number(d.id) || libro.id;
      libro.letto = Boolean(d.letto);

      return libro;
    });

    Libro.contatore = Math.max(
      0,
      ...libriCaricati.map((libro) => libro.id)
    );

    return libriCaricati;
  } catch (errore) {
    console.error("Impossibile caricare i libri:", errore);
    return [];
  }
}

const libri = caricaLibri();

function salvaLibri() {
  try {
    const dati = libri.map((libro) => ({
      id: libro.id,
      titolo: libro.titolo,
      autore: libro.autore,
      anno: libro.anno,
      letto: libro.letto,
      tipo: libro instanceof LibroDigitale ? "digitale" : "cartaceo",
      dimensioneMb:
        libro instanceof LibroDigitale ? libro.dimensioneMb : null,
    }));

    localStorage.setItem(CHIAVE_LIBRI, JSON.stringify(dati));
  } catch (errore) {
    console.error("Impossibile salvare i libri:", errore);
  }
}

// === Render ===
function renderLibri() {
  const html = libri
    .map(
      (l) => `
    <li class="${l.letto ? "letto" : ""}" data-id="${l.id}">
      <div class="info">
        <span class="titolo">${l.titolo}</span>
        <span class="badge-formato">${l.formato()}</span>
        <div class="meta">${l.autore} — ${l.anno}</div>
      </div>
      <div class="azioni">
        ${
          l.letto
            ? "✓ letto"
            : '<button data-azione="leggi">Segna come letto</button>'
        }
        <button data-azione="elimina">Elimina</button>
      </div>
    </li>
  `
    )
    .join("");

  document.getElementById("lista-libri").innerHTML = html;
  document.getElementById("contatore").textContent = libri.length;
}

// === Eventi ===

// Mostra o nasconde il campo "dimensione" in base al formato selezionato
document.getElementById("formato").addEventListener("change", (e) => {
  const campo = document.getElementById("campo-dimensione");

  if (e.target.value === "digitale") {
    campo.removeAttribute("hidden");
  } else {
    campo.setAttribute("hidden", "");
  }
});

// Submit del form: crea il libro, lo aggiunge all'array e lo salva
document.getElementById("aggiungi-libro").addEventListener("submit", (e) => {
  e.preventDefault();

  const titolo = document.getElementById("titolo").value;
  const autore = document.getElementById("autore").value;
  const anno = parseInt(document.getElementById("anno").value, 10);
  const formato = document.getElementById("formato").value;

  let nuovo;

  if (formato === "digitale") {
    const dim =
      parseFloat(document.getElementById("dimensione").value) || 0;

    nuovo = new LibroDigitale(titolo, autore, anno, dim);
  } else {
    nuovo = new Libro(titolo, autore, anno);
  }

  libri.push(nuovo);
  salvaLibri();
  renderLibri();

  e.target.reset();
  document.getElementById("campo-dimensione").setAttribute("hidden", "");
});

// Gestisce i pulsanti "Segna come letto" ed "Elimina"
document.getElementById("lista-libri").addEventListener("click", (e) => {
  const bottone = e.target.closest("[data-azione]");

  if (!bottone) return;

  const azione = bottone.dataset.azione;
  const card = bottone.closest("li");
  const id = Number(card.dataset.id);
  const indice = libri.findIndex((libro) => libro.id === id);

  if (indice === -1) return;

  if (azione === "elimina") {
    libri.splice(indice, 1);
  } else if (azione === "leggi") {
    libri[indice].segnaComeLetto();
  } else {
    return;
  }

  salvaLibri();
  renderLibri();
});

// === Render iniziale ===
renderLibri();