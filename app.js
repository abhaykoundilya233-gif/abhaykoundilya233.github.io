const $ = (id) => document.getElementById(id);

const categoryFallbackImages = {
  "Archaeology": "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=1000&q=85",
  "Inscriptions": "https://images.unsplash.com/photo-1600100397608-f0109b7f2a5c?auto=format&fit=crop&w=1000&q=85",
  "Manuscripts": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1000&q=85",
  "Coins": "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=1000&q=85",
  "Architecture": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=85",
  "Art & Iconography": "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=85"
};

let cachedArticles = [];
let articlesLoaded = false;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

function plainText(html = "") {
  const element = document.createElement("div");
  element.innerHTML = html;
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function safeArticleContent(html = "") {
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"]
    });
  }
  return escapeHTML(plainText(html)).replace(/\n/g, "<br>");
}

function dateMillis(value) {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatDate(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  }).format(date);
}

function readingTime(html = "") {
  const words = plainText(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function imageFor(article) {
  return article.coverUrl || categoryFallbackImages[article.category] || categoryFallbackImages.Archaeology;
}

function articleUrl(article) {
  return `article.html?slug=${encodeURIComponent(article.slug || article.id || "")}`;
}

function cardHTML(article) {
  const title = escapeHTML(article.title || "Untitled article");
  const category = escapeHTML(article.category || "Research");
  const excerpt = escapeHTML(article.excerpt || plainText(article.content || "").slice(0, 155));
  const url = articleUrl(article);
  return `<article class="article-card">
    <a class="card-image-link" href="${url}" aria-label="Read ${title}">
      <div class="card-image"><img src="${escapeHTML(imageFor(article))}" alt="${title}" loading="lazy"><span class="card-image-arrow">↗</span></div>
    </a>
    <div class="card-body"><div class="card-meta"><span class="category-label">${category}</span><span>${escapeHTML(formatDate(article.createdAt))}</span></div>
      <h3><a href="${url}">${title}</a></h3><p>${excerpt || "Open this article to explore the research and sources."}</p>
      <a class="card-read-link" href="${url}">Read article <span>↗</span></a>
    </div>
  </article>`;
}

async function fetchArticles() {
  if (articlesLoaded) return cachedArticles;
  const response = await fetch("data/articles.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load the article file (${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("The article data file must contain a JSON array.");
  cachedArticles = data.filter(article => article && article.status === "published");
  articlesLoaded = true;
  return cachedArticles;
}

function showPublicError(container, error) {
  if (!container) return;
  console.error(error);
  container.innerHTML = `<div class="empty-state"><span class="empty-symbol">!</span><h2>The archive could not load</h2><p>Please refresh the page in a moment. If you are testing locally, open the folder using VS Code Live Server instead of opening the HTML file directly.</p></div>`;
}

async function loadHome() {
  const target = $("featuredArticles");
  if (!target) return;
  try {
    const articles = await fetchArticles();
    target.innerHTML = articles.length
      ? [...articles].sort((a, b) => dateMillis(b.createdAt) - dateMillis(a.createdAt)).slice(0, 3).map(cardHTML).join("")
      : `<div class="empty-home"><p class="eyebrow">THE ARCHIVE IS JUST BEGINNING</p><h3>Your first research article will appear here.</h3><p>New published research will be displayed here.</p></div>`;
  } catch (error) { showPublicError(target, error); }
}

function getCategoryFromURL() {
  return new URLSearchParams(location.search).get("category") || "";
}

async function loadArchive() {
  const target = $("articlesContainer");
  if (!target) return;
  const searchInput = $("archiveSearch");
  const categorySelect = $("categoryFilter");
  const sortSelect = $("sortFilter");
  const initialCategory = getCategoryFromURL();

  try {
    cachedArticles = await fetchArticles();
    if (initialCategory && [...categorySelect.options].some(option => option.value === initialCategory || option.text === initialCategory)) {
      categorySelect.value = initialCategory;
    }

    const render = () => {
      const term = (searchInput.value || "").trim().toLowerCase();
      const category = categorySelect.value;
      let rows = cachedArticles.filter(article => {
        const text = `${article.title || ""} ${article.excerpt || ""} ${plainText(article.content || "")} ${article.category || ""}`.toLowerCase();
        return (!term || text.includes(term)) && (!category || article.category === category);
      });
      if (sortSelect.value === "oldest") rows.sort((a, b) => dateMillis(a.createdAt) - dateMillis(b.createdAt));
      else if (sortSelect.value === "az") rows.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      else rows.sort((a, b) => dateMillis(b.createdAt) - dateMillis(a.createdAt));

      $("resultCount").textContent = `${rows.length} ${rows.length === 1 ? "ARTICLE" : "ARTICLES"}`;
      $("emptyState").classList.toggle("hidden", rows.length !== 0);
      target.classList.toggle("hidden", rows.length === 0);
      target.innerHTML = rows.map(cardHTML).join("");
    };

    searchInput.addEventListener("input", render);
    categorySelect.addEventListener("change", render);
    sortSelect.addEventListener("change", render);
    $("clearFilters").addEventListener("click", () => {
      searchInput.value = "";
      categorySelect.value = "";
      sortSelect.value = "newest";
      render();
    });
    render();
  } catch (error) { showPublicError(target, error); }
}

async function loadArticle() {
  const root = $("articleRoot");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const requestedSlug = params.get("slug") || params.get("id");
  if (!requestedSlug) {
    root.innerHTML = `<div class="empty-state page-pad"><h2>Choose an article</h2><p>Open an article from the archive to read it here.</p><a class="button button-dark" href="articles.html">Browse the archive</a></div>`;
    return;
  }

  try {
    const articles = await fetchArticles();
    const article = articles.find(item => item.slug === requestedSlug || item.id === requestedSlug);
    if (!article) {
      root.innerHTML = `<div class="empty-state page-pad"><span class="empty-symbol">⌕</span><h2>Article not found</h2><p>This article may be unpublished or the link may be incorrect.</p><a class="button button-dark" href="articles.html">Back to the archive</a></div>`;
      return;
    }

    document.title = `${article.title} — Āraṇyānāṃ Pataye`;
    const safeContent = safeArticleContent(article.content || "");
    root.innerHTML = `<section class="article-hero wrap"><a class="back-link" href="articles.html">← Back to the archive</a><div class="article-head-meta"><span class="category-label">${escapeHTML(article.category || "Research")}</span><span>${escapeHTML(formatDate(article.createdAt))}</span><span>${readingTime(article.content || "")}</span></div><h1>${escapeHTML(article.title || "Untitled article")}</h1><p class="article-deck">${escapeHTML(article.excerpt || "")}</p><div class="article-byline"><span class="byline-mark">Ā</span><span><strong>Āraṇyānāṃ Pataye</strong><small>ARCHAEOLOGY OF ĀRYĀVARTA</small></span></div></section>
      <div class="article-cover wrap"><img src="${escapeHTML(imageFor(article))}" alt="${escapeHTML(article.title || "Article cover")}"></div>
      <article class="article-reading wrap"><div class="article-prose">${safeContent}</div><aside class="article-endnote"><span>✳</span><p>Thank you for exploring the evidence with <em>Āraṇyānāṃ Pataye.</em></p></aside><div class="article-footer-actions"><a class="text-link" href="articles.html">← Explore more research</a><button class="text-link copy-link" id="copyArticleLink" type="button">Copy article link ↗</button></div></article>
      <section class="related-section"><div class="wrap"><div class="section-heading"><div><p class="eyebrow"><span class="eyebrow-line"></span> CONTINUE EXPLORING</p><h2>More from the archive</h2></div><a class="text-link" href="articles.html">View all <span>↗</span></a></div><div class="article-grid" id="relatedArticles"></div></div></section>`;

    $("copyArticleLink").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        $("copyArticleLink").textContent = "Link copied ✓";
      } catch {
        $("copyArticleLink").textContent = "Copy unavailable";
      }
    });
    const related = articles.filter(item => item.slug !== article.slug).slice(0, 3);
    $("relatedArticles").innerHTML = related.map(cardHTML).join("") || `<p class="muted-note">More articles will appear here as the archive grows.</p>`;
  } catch (error) { showPublicError(root, error); }
}

function setupNavigation() {
  $("menuToggle")?.addEventListener("click", () => {
    const nav = $("mainNav");
    if (!nav) return;
    const expanded = $("menuToggle").getAttribute("aria-expanded") === "true";
    $("menuToggle").setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("nav-open", !expanded);
  });
  if ($("year")) $("year").textContent = new Date().getFullYear();
}

setupNavigation();
loadHome();
loadArchive();
loadArticle();
