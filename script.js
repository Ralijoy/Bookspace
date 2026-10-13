
"use strict";

const KEY = "bookspace-books-v1";


const catalogo = [
  // Livros originais
  ["Crime e Castigo", "Fiódor Dostoiévski", "Romance psicológico"],
  ["Rashōmon", "Ryūnosuke Akutagawa", "Contos"],
  ["Declínio de um Homem", "Osamu Dazai", "Literatura japonesa"],

  // Clássicos
  ["Orgulho e Preconceito", "Jane Austen", "Romance"],
  ["Jane Eyre", "Charlotte Brontë", "Romance"],
  ["O Morro dos Ventos Uivantes", "Emily Brontë", "Romance"],
  ["O Retrato de Dorian Gray", "Oscar Wilde", "Clássico"],
  ["Frankenstein", "Mary Shelley", "Terror"],
  ["Drácula", "Bram Stoker", "Terror"],
  ["1984", "George Orwell", "Distopia"],
  ["A Revolução dos Bichos", "George Orwell", "Sátira"],
  ["Admirável Mundo Novo", "Aldous Huxley", "Distopia"],
  ["O Grande Gatsby", "F. Scott Fitzgerald", "Clássico"],
  ["O Estrangeiro", "Albert Camus", "Filosofia"],
  ["A Metamorfose", "Franz Kafka", "Clássico"],
  ["Os Irmãos Karamázov", "Fiódor Dostoiévski", "Clássico"],

  // Literatura japonesa
  ["Kafka à Beira-Mar", "Haruki Murakami", "Realismo mágico"],
  ["Norwegian Wood", "Haruki Murakami", "Romance"],
  ["A Vegetariana", "Han Kang", "Ficção literária"],
  ["A Mulher das Dunas", "Kōbō Abe", "Ficção"],
  ["O Gato que Amava Livros", "Sōsuke Natsukawa", "Fantasia"],
  ["Kitchen", "Banana Yoshimoto", "Ficção literária"],

  // Fantasia
  ["Trono de Vidro", "Sarah J. Maas", "Fantasia"],
  ["Corte de Espinhos e Rosas", "Sarah J. Maas", "Fantasia"],
  ["O Hobbit", "J. R. R. Tolkien", "Fantasia"],
  ["A Sociedade do Anel", "J. R. R. Tolkien", "Fantasia"],
  ["O Nome do Vento", "Patrick Rothfuss", "Fantasia"],
  ["Mistborn: O Império Final", "Brandon Sanderson", "Fantasia"],
  ["A Vida Invisível de Addie LaRue", "V. E. Schwab", "Fantasia"],
  ["Piranesi", "Susanna Clarke", "Fantasia"],
  ["A Biblioteca da Meia-Noite", "Matt Haig", "Fantasia"],

  // Suspense e ficção científica
  ["Matéria Escura", "Blake Crouch", "Ficção científica"],
  ["Recursão", "Blake Crouch", "Ficção científica"],
  ["O Paciente Silencioso", "Alex Michaelides", "Suspense"],
  ["Garota Exemplar", "Gillian Flynn", "Suspense"],
  ["Verity", "Colleen Hoover", "Suspense"],
  ["E Não Sobrou Nenhum", "Agatha Christie", "Mistério"],
  ["Assassinato no Expresso do Oriente", "Agatha Christie", "Mistério"],
  ["O Iluminado", "Stephen King", "Terror"],
  ["Misery", "Stephen King", "Suspense"],
  ["Duna", "Frank Herbert", "Ficção científica"],

  // Romance
  ["Os Sete Maridos de Evelyn Hugo", "Taylor Jenkins Reid", "Romance"],
  ["A Hipótese do Amor", "Ali Hazelwood", "Romance"]
];

const seed = catalogo.map(([title, author, genre], index) => ({
  id: `livro-${index + 1}`,
  title,
  author,
  genre,
  status: index === 0 ? "Lendo" :
          index === 2 ? "Lido" : "Quero ler",
  pages: 0,
  progress: 0,
  rating: 0,
  cover: "",
  description: "",
  notes: "",
  favorite: false,
  created: catalogo.length - index
}));

const $ = selector => document.querySelector(selector);

const grid = $("#book-grid");
const search = $("#search");
const sort = $("#sort");
const bookDialog = $("#book-dialog");
const detailsDialog = $("#details-dialog");
const form = $("#book-form");

let books = load();
let filter = "Todos";
let editing = null;
let selected = null;

// Armazenamento

function load() {
  try {
    const raw = localStorage.getItem(KEY);

    if (raw === null) {
      return structuredClone(seed);
    }

    const data = JSON.parse(raw);

    return Array.isArray(data) ? data : structuredClone(seed);
  } catch (error) {
    console.warn("Erro ao carregar os livros:", error);
    return structuredClone(seed);
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(books));
    return true;
  } catch (error) {
    alert("Não foi possível salvar os dados neste navegador.");
    return false;
  }
}

// Elementos auxiliares

function el(tag, className = "", text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function notify(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(notify.timer);

  notify.timer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2800);
}

function percentage(book) {
  if (book.pages > 0) {
    return Math.min(
      100,
      Math.round((book.progress / book.pages) * 100)
    );
  }

  return book.status === "Lido" ? 100 : 0;
}

// Capas

function placeholder(book) {
  const element = el("div", "cover-placeholder", book.title);

  const colors = [
    "#4c6655",
    "#98886b",
    "#7b8b79",
    "#566b79"
  ];

  element.style.setProperty(
    "--book-color",
    colors[book.title.length % colors.length]
  );

  return element;
}

function cover(book) {
  const wrapper = el("div", "cover-wrap");

  if (book.cover) {
    const image = el("img");

    image.src = book.cover;
    image.alt = "Capa de " + book.title;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";

    image.onerror = () => {
      image.remove();
      wrapper.prepend(placeholder(book));
    };

    wrapper.append(image);
  } else {
    wrapper.append(placeholder(book));
  }

  return wrapper;
}

// Alterar status

function setStatus(id, status) {
  const book = books.find(item => item.id === id);

  if (!book) return;

  book.status = status;

  if (status === "Lido" && book.pages > 0) {
    book.progress = book.pages;
  }

  save();
  render();
  notify("Status atualizado");
}

// Favoritos

function toggleFavorite(id) {
  const book = books.find(item => item.id === id);

  if (!book) return;

  book.favorite = !book.favorite;

  save();
  render();

  notify(
    book.favorite
      ? "Adicionado aos favoritos"
      : "Removido dos favoritos"
  );
}

// Criar card de livro

function card(book) {
  const article = el("article", "book-card");
  const visual = cover(book);

  const heart = el(
    "button",
    "heart",
    book.favorite ? "♥" : "♡"
  );

  heart.type = "button";
  heart.setAttribute(
    "aria-label",
    book.favorite
      ? "Remover dos favoritos"
      : "Adicionar aos favoritos"
  );
  heart.setAttribute("aria-pressed", String(book.favorite));

  heart.addEventListener("click", () => {
    toggleFavorite(book.id);
  });

  visual.append(heart);

  article.append(
    visual,
    el("h3", "", book.title),
    el("p", "author", book.author)
  );

  const meta = el("div", "meta");

  meta.append(
    el("span", "", book.genre || "Sem gênero"),
    el(
      "span",
      "",
      book.rating ? `★ ${book.rating}/5` : book.status
    )
  );

  article.append(meta);

  // Barra de progresso
  if (
    book.status === "Lendo" ||
    (book.status === "Lido" && book.pages)
  ) {
    const track = el("div", "progress");
    const bar = el("span");

    bar.style.width = percentage(book) + "%";
    track.append(bar);

    article.append(
      track,
      el(
        "div",
        "meta",
        book.pages
          ? `${book.progress} de ${book.pages} páginas · ${percentage(book)}%`
          : "Páginas não informadas"
      )
    );
  }

  // Botões e seleção de status
  const actions = el("div", "card-actions");
  const select = el("select");

  select.setAttribute(
    "aria-label",
    "Status de " + book.title
  );

  ["Quero ler", "Lendo", "Lido"].forEach(status => {
    const option = el("option", "", status);
    option.value = status;
    select.append(option);
  });

  select.value = book.status;

  select.addEventListener("change", () => {
    setStatus(book.id, select.value);
  });

  const view = el("button", "", "Detalhes");
  view.type = "button";

  view.addEventListener("click", () => {
    showDetails(book.id);
  });

  actions.append(select, view);
  article.append(actions);

  return article;
}

// Renderizar a biblioteca

function render() {
  const term = search.value
    .trim()
    .toLocaleLowerCase("pt-BR");

  let visible = books.filter(book => {
    const match = [
      book.title,
      book.author,
      book.genre
    ].some(value =>
      String(value || "")
        .toLocaleLowerCase("pt-BR")
        .includes(term)
    );

    const matchesFilter =
      filter === "Todos" ||
      (
        filter === "Favoritos"
          ? book.favorite
          : book.status === filter
      );

    return match && matchesFilter;
  });

  // Ordenação
  if (sort.value === "title") {
    visible.sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR")
    );
  }

  if (sort.value === "author") {
    visible.sort((a, b) =>
      a.author.localeCompare(b.author, "pt-BR")
    );
  }

  if (sort.value === "rating") {
    visible.sort((a, b) => b.rating - a.rating);
  }

  if (sort.value === "recent") {
    visible.sort((a, b) => b.created - a.created);
  }

  grid.replaceChildren(...visible.map(card));

  $("#empty").hidden = visible.length > 0;

  $("#results").textContent =
    `${visible.length} ${
      visible.length === 1
        ? "livro encontrado"
        : "livros encontrados"
    }`;

  // Estatísticas
  $("#stat-total").textContent = books.length;

  $("#stat-read").textContent = books.filter(
    book => book.status === "Lido"
  ).length;

  $("#stat-reading").textContent = books.filter(
    book => book.status === "Lendo"
  ).length;

  const totalPages = books.reduce(
    (sum, book) => sum + (Number(book.progress) || 0),
    0
  );

  $("#stat-pages").textContent =
    totalPages.toLocaleString("pt-BR");
}

// Abrir formulário

function openForm(id = null) {
  editing = id;
  form.reset();

  const book = books.find(item => item.id === id);

  $("#dialog-title").textContent = book
    ? "Editar livro"
    : "Adicionar livro";

  if (book) {
    $("#f-title").value = book.title;
    $("#f-author").value = book.author;
    $("#f-genre").value = book.genre;
    $("#f-status").value = book.status;
    $("#f-pages").value = book.pages || "";
    $("#f-progress").value = book.progress || "";
    $("#f-rating").value = book.rating;
    $("#f-cover").value = book.cover;
    $("#f-description").value = book.description;
    $("#f-notes").value = book.notes;
  }

  bookDialog.showModal();
  $("#f-title").focus();
}

function closeForm() {
  bookDialog.close();
}

// Salvar formulário

form.addEventListener("submit", event => {
  event.preventDefault();

  const title = $("#f-title").value.trim();
  const author = $("#f-author").value.trim();
  const pages = Number($("#f-pages").value || 0);
  const progress = Number($("#f-progress").value || 0);
  const status = $("#f-status").value;

  if (!title || !author) {
    notify("Informe título e autor");
    return;
  }

  if (
    !Number.isSafeInteger(pages) ||
    !Number.isSafeInteger(progress) ||
    pages < 0 ||
    progress < 0 ||
    pages > 100000 ||
    progress > 100000
  ) {
    notify("Informe números válidos de páginas");
    return;
  }

  if (
    (pages === 0 && progress > 0) ||
    (pages > 0 && progress > pages)
  ) {
    notify("Páginas lidas não podem superar o total");
    return;
  }

  const previous = books.find(
    item => item.id === editing
  );

  const data = {
    id: previous?.id || crypto.randomUUID(),
    title,
    author,
    genre: $("#f-genre").value.trim(),
    status,
    pages,
    progress:
      status === "Lido" && pages ? pages : progress,
    rating: Number($("#f-rating").value),
    cover: $("#f-cover").value.trim(),
    description: $("#f-description").value.trim(),
    notes: $("#f-notes").value.trim(),
    favorite: previous?.favorite || false,
    created: previous?.created || Date.now()
  };

  if (previous) {
    books = books.map(book =>
      book.id === editing ? data : book
    );
  } else {
    books.unshift(data);
  }

  save();
  closeForm();
  render();

  notify(
    previous ? "Livro atualizado" : "Livro adicionado"
  );
});

// Modal de detalhes

function showDetails(id) {
  selected = id;

  const book = books.find(item => item.id === id);

  if (!book) return;

  const area = $("#details-content");
  area.replaceChildren();

  const top = el("div", "details-top");
  const visual = cover(book);

  visual.style.width = "150px";
  visual.style.minWidth = "150px";
  visual.style.height = "215px";

  const info = el("div");
  const title = el("h2", "", book.title);

  title.id = "details-title";

  info.append(
    title,
    el("p", "", book.author),
    el(
      "small",
      "",
      `${book.genre || "Sem gênero"} · ${book.status} · ${
        book.rating
          ? "★ " + book.rating + "/5"
          : "Sem avaliação"
      }`
    ),
    el(
      "p",
      "",
      book.pages
        ? `${book.progress}/${book.pages} páginas (${percentage(book)}%)`
        : "Páginas não informadas"
    )
  );

  top.append(visual, info);
  area.append(top);

  // Sinopse e anotações
  const sections = [
    ["Sinopse", book.description],
    ["Minhas anotações", book.notes]
  ];

  sections.forEach(([heading, value]) => {
    const section = el("section", "details-section");

    section.append(
      el("h3", "", heading),
      el("p", "", value || "Nada registrado ainda.")
    );

    area.append(section);
  });

  // Exclusão
  const section = el("section", "details-section");
  const remove = el(
    "button",
    "danger",
    "Excluir este livro"
  );

  remove.type = "button";

  remove.addEventListener("click", () => {
    const confirmed = confirm(
      `Excluir "${book.title}" da estante? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    books = books.filter(item => item.id !== id);

    save();
    detailsDialog.close();
    render();
    notify("Livro removido");
  });

  section.append(remove);
  area.append(section);

  detailsDialog.showModal();
}

// Eventos dos botões

$("#add-book").addEventListener("click", () => {
  openForm();
});

$("#close-dialog").addEventListener("click", closeForm);
$("#cancel-dialog").addEventListener("click", closeForm);

$("#close-details").addEventListener("click", () => {
  detailsDialog.close();
});

$("#edit-details").addEventListener("click", () => {
  detailsDialog.close();
  openForm(selected);
});

// Pesquisa e ordenação

search.addEventListener("input", render);
sort.addEventListener("change", render);

// Filtros

$("#filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");

  if (!button) return;

  filter = button.dataset.filter;

  document.querySelectorAll(".filter").forEach(item => {
    const active = item === button;

    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });

  render();
});

// Menu do celular

$("#menu-toggle").addEventListener("click", () => {
  const open = $("#menu").classList.toggle("open");

  $("#menu-toggle").setAttribute(
    "aria-expanded",
    String(open)
  );
});

document.querySelectorAll("#menu a").forEach(link => {
  link.addEventListener("click", () => {
    $("#menu").classList.remove("open");
    $("#menu-toggle").setAttribute(
      "aria-expanded",
      "false"
    );
  });
});

// Inicializar o site

function importarNovosLivros() {
  let adicionados = 0;

  seed.forEach(novoLivro => {
    const jaExiste = books.some(livro =>
      livro.title.toLocaleLowerCase("pt-BR") ===
        novoLivro.title.toLocaleLowerCase("pt-BR") &&
      livro.author.toLocaleLowerCase("pt-BR") ===
        novoLivro.author.toLocaleLowerCase("pt-BR")
    );

    if (!jaExiste) {
      books.push(novoLivro);
      adicionados++;
    }
  });

  if (adicionados > 0) {
    save();
    console.log(`${adicionados} livros adicionados ao BookSpace.`);
  }
}

importarNovosLivros();

render();
