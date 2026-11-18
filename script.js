// Mini-libreria — Settimana VII Giorno I
// Libreria locale con localStorage e ricerca tramite Open Library API

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

// === localStorage ===
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

// === Render della libreria personale ===
function renderLibri() {
  const lista = document.getElementById("lista-libri");
  lista.replaceChildren();

  libri.forEach((libro) => {
    const elemento = document.createElement("li");
    elemento.className = libro.letto ? "letto" : "";
    elemento.dataset.id = libro.id;

    const info = document.createElement("div");
    info.className = "info";

    const titolo = document.createElement("span");
    titolo.className = "titolo";
    titolo.textContent = libro.titolo;

    const badgeFormato = document.createElement("span");
    badgeFormato.className = "badge-formato";
    badgeFormato.textContent = libro.formato();

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${libro.autore} — ${libro.anno}`;

    info.append(titolo, badgeFormato, meta);

    const azioni = document.createElement("div");
    azioni.className = "azioni";

    if (libro.letto) {
      const statoLetto = document.createElement("span");
      statoLetto.textContent = "✓ letto";
      azioni.appendChild(statoLetto);
    } else {
      const bottoneLeggi = document.createElement("button");
      bottoneLeggi.type = "button";
      bottoneLeggi.dataset.azione = "leggi";
      bottoneLeggi.textContent = "Segna come letto";
      azioni.appendChild(bottoneLeggi);
    }

    const bottoneElimina = document.createElement("button");
    bottoneElimina.type = "button";
    bottoneElimina.dataset.azione = "elimina";
    bottoneElimina.textContent = "Elimina";
    azioni.appendChild(bottoneElimina);

    elemento.append(info, azioni);
    lista.appendChild(elemento);
  });

  document.getElementById("contatore").textContent = libri.length;
}

// === Selezione del formato ===
document.getElementById("formato").addEventListener("change", (e) => {
  const campoDimensione = document.getElementById("campo-dimensione");

  if (e.target.value === "digitale") {
    campoDimensione.removeAttribute("hidden");
  } else {
    campoDimensione.setAttribute("hidden", "");
  }
});

// === Aggiunta di un libro ===
document.getElementById("aggiungi-libro").addEventListener("submit", (e) => {
  e.preventDefault();

  const titolo = document.getElementById("titolo").value.trim();
  const autore = document.getElementById("autore").value.trim();
  const anno = parseInt(document.getElementById("anno").value, 10);
  const formato = document.getElementById("formato").value;

  let nuovoLibro;

  if (formato === "digitale") {
    const dimensione =
      parseFloat(document.getElementById("dimensione").value) || 0;

    nuovoLibro = new LibroDigitale(titolo, autore, anno, dimensione);
  } else {
    nuovoLibro = new Libro(titolo, autore, anno);
  }

  libri.push(nuovoLibro);
  salvaLibri();
  renderLibri();

  e.target.reset();
  document.getElementById("campo-dimensione").setAttribute("hidden", "");
});

// === Segna come letto ed elimina un libro ===
document.getElementById("lista-libri").addEventListener("click", (e) => {
  const bottone = e.target.closest("[data-azione]");

  if (!bottone) return;

  const azione = bottone.dataset.azione;
  const elemento = bottone.closest("li");
  const id = Number(elemento.dataset.id);
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

// === Ricerca tramite Open Library API ===
const formCerca = document.getElementById("cerca-libri");
const termineRicerca = document.getElementById("termine-ricerca");
const statoRicerca = document.getElementById("stato-ricerca");
const risultatiRicerca = document.getElementById("risultati-ricerca");

let numeroRicercaCorrente = 0;
termineRicerca.addEventListener("input", () => {
  // Invalida eventuali ricerche ancora in corso
  numeroRicercaCorrente++;

  // Cancella i risultati e il messaggio precedenti
  risultatiRicerca.replaceChildren();
  statoRicerca.textContent = "";
});

// Invio avvia la ricerca; Shift+Invio inserisce una nuova riga
termineRicerca.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    formCerca.requestSubmit();
  }
});

async function cercaLibriOpenLibrary(campo, termine) {
  const url = new URL("https://openlibrary.org/search.json");

  url.searchParams.set(campo, termine);
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year"
  );
  url.searchParams.set("limit", "20");

  const risposta = await fetch(url);
  const dati = await risposta.json();

  if (!risposta.ok) {
    throw new Error("Errore durante la ricerca dei libri.");
  }

  return dati.docs || [];
}

const libriOpenLibrary = new Map();

function mostraRisultatiRicerca(libriTrovati) {
  risultatiRicerca.replaceChildren();
  libriOpenLibrary.clear();

  libriTrovati.forEach((libro) => {
    const info = document.createElement("div");
    info.className = "info";

    const titolo = document.createElement("span");
    titolo.className = "titolo";
    titolo.textContent = libro.title || "Titolo non disponibile";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent =
      libro.author_name?.join(", ") || "Autore non disponibile";

    if (libro.first_publish_year) {
      meta.textContent += ` — ${libro.first_publish_year}`;
    }

    info.append(titolo, meta);

    const azioni = document.createElement("div");
    azioni.className = "azioni";

    const bottoneAggiungi = document.createElement("button");
    bottoneAggiungi.type = "button";
    bottoneAggiungi.dataset.azione = "aggiungi-api";
    bottoneAggiungi.dataset.chiave = libro.key;
    bottoneAggiungi.textContent = "Aggiungi";

    libriOpenLibrary.set(libro.key, libro);

    azioni.appendChild(bottoneAggiungi);

    const elemento = document.createElement("li");
    elemento.append(info, azioni);
    risultatiRicerca.appendChild(elemento);
  });
}

risultatiRicerca.addEventListener("click", (e) => {
  const bottone = e.target.closest('[data-azione="aggiungi-api"]');

  if (!bottone) return;

  const libroApi = libriOpenLibrary.get(bottone.dataset.chiave);

  if (!libroApi) return;

  const titolo = libroApi.title || "Titolo non disponibile";
  const autore =
    libroApi.author_name?.join(", ") || "Autore non disponibile";
  const anno = Number(libroApi.first_publish_year) || "Anno non disponibile";

  // Lo aggiunge alla libreria come libro cartaceo
  const nuovoLibro = new Libro(titolo, autore, anno);
  libri.push(nuovoLibro);

  salvaLibri();
  renderLibri();

  bottone.textContent = "Aggiunto";
  bottone.disabled = true;
});

formCerca.addEventListener("submit", async (e) => {
  e.preventDefault();

  const termine = termineRicerca.value.trim();
  if (!termine) return;

  const numeroRichiesta = ++numeroRicercaCorrente;

  statoRicerca.textContent = "Ricerca in corso…";
  risultatiRicerca.replaceChildren();

  try {
    const [risultatiTitolo, risultatiAutore] = await Promise.all([
      cercaLibriOpenLibrary("title", termine),
      cercaLibriOpenLibrary("author", termine),
    ]);

    // Unisce i risultati e rimuove i duplicati
    const libriUnici = [
      ...new Map(
        [...risultatiTitolo, ...risultatiAutore].map((libro) => [
          libro.key,
          libro,
        ])
      ).values(),
    ];

    const termineNormalizzato = termine.toLocaleLowerCase("it");

    // Mostra i libri che contengono il termine nel titolo o nell'autore
    const libriFiltrati = libriUnici.filter((libro) => {
      const titolo = (libro.title || "").toLocaleLowerCase("it");
      const autori = (libro.author_name || []).map((autore) =>
        autore.toLocaleLowerCase("it")
      );

      return (
        titolo.includes(termineNormalizzato) ||
        autori.some((autore) => autore.includes(termineNormalizzato))
      );
    });

    // Ignora le risposte appartenenti a ricerche precedenti
    if (numeroRichiesta !== numeroRicercaCorrente) return;

    mostraRisultatiRicerca(libriFiltrati);

    statoRicerca.textContent = libriFiltrati.length
      ? `Risultati trovati: ${libriFiltrati.length}`
      : "Nessun libro trovato.";
  } catch (errore) {
    if (numeroRichiesta !== numeroRicercaCorrente) return;

    console.error(errore);
    statoRicerca.textContent =
      "Non è stato possibile completare la ricerca. Riprova.";
  }
});

// === Render iniziale ===
renderLibri();
