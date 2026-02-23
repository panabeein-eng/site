const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1qAvF2PiXwx_BTr2d-EuaetzEDXDPWCxvWtBxgko08iY/export?format=csv&gid=0";

const FALLBACK_PRODUCTS = [
  {
    name: "Solar Panel 550W",
    category: "Solar",
    price: "₹15,500",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    description: "High-efficiency monocrystalline panel for rooftop systems."
  },
  {
    name: "Cordless Drill Machine",
    category: "Tools",
    price: "₹3,200",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80",
    description: "18V drill suitable for household and workshop use."
  },
  {
    name: "Angle Grinder",
    category: "Tools",
    price: "₹2,450",
    image: "https://images.unsplash.com/photo-1581092918484-8313ac96ac4a?auto=format&fit=crop&w=1200&q=80",
    description: "Durable grinder for cutting and metalwork applications."
  },
  {
    name: "Solar Inverter 5kW",
    category: "Solar",
    price: "₹43,000",
    image: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=1200&q=80",
    description: "Efficient hybrid inverter for home and small business setups."
  }
];

const productGrid = document.getElementById("productGrid");
const shopStatus = document.getElementById("shopStatus");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const blogList = document.getElementById("blogList");
const blogStatus = document.getElementById("blogStatus");

let allProducts = [];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      value = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value.trim());
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.toLowerCase());

  return rows.slice(1).map((r) =>
    headers.reduce((item, header, index) => {
      item[header] = r[index] || "";
      return item;
    }, {})
  );
}

function formatProduct(product) {
  return {
    name: product.name || "Unnamed Product",
    category: product.category || "General",
    price: product.price || "Price on request",
    image: product.image || "",
    description: product.description || "No product description available."
  };
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function updateCategoryFilter(products) {
  const categories = [...new Set(products.map((item) => item.category))].sort();
  categoryFilter.innerHTML = '<option value="all">All categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function renderProducts(products) {
  if (!products.length) {
    productGrid.innerHTML = "";
    shopStatus.textContent = "No products match your search.";
    return;
  }

  shopStatus.textContent = `Showing ${products.length} product(s).`;
  productGrid.innerHTML = products
    .map(
      (product) => `
      <article class="product-card" itemprop="itemListElement" itemscope itemtype="https://schema.org/Product">
        ${product.image ? `<img src="${product.image}" alt="${product.name}" loading="lazy" itemprop="image" />` : ""}
        <span class="category-chip">${product.category}</span>
        <h3 itemprop="name">${product.name}</h3>
        <p>${product.description}</p>
        <p class="price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
          <span itemprop="priceCurrency" content="INR">₹</span>
          <span itemprop="price">${product.price.replace(/[^\d.]/g, "") || product.price}</span>
          <meta itemprop="availability" content="https://schema.org/InStock" />
        </p>
      </article>
    `
    )
    .join("");
}

function buildPost(product) {
  const title = `${product.name}: complete buying and usage guide`;
  const id = `post-${slugify(product.name)}`;

  return {
    id,
    title,
    category: product.category,
    image: product.image,
    excerpt: `Understand features, ideal use cases, pricing context, and maintenance tips before buying ${product.name}.`,
    body: [
      `${product.name} is one of our recommended ${product.category.toLowerCase()} products at JK Enterprises Pehowa. ${product.description}`,
      `Before purchase, compare your daily usage, expected workload, and installation/operating conditions. This helps pick the right model and avoid over-spending.`,
      `For pricing and stock updates, contact the store directly. We also provide practical guidance on setup, safe usage, and after-sales support.`
    ]
  };
}

function renderBlogPosts(products) {
  if (!blogList || !blogStatus) return;

  const posts = products.map(buildPost);

  if (!posts.length) {
    blogList.innerHTML = "";
    blogStatus.textContent = "No blog posts available yet.";
    return;
  }

  blogList.innerHTML = posts
    .map(
      (post) => `
      <article id="${post.id}" class="blog-card" itemscope itemtype="https://schema.org/BlogPosting">
        ${post.image ? `<img src="${post.image}" alt="${post.title}" loading="lazy" itemprop="image" />` : ""}
        <span class="category-chip">${post.category}</span>
        <h3 itemprop="headline">${post.title}</h3>
        <p itemprop="description">${post.excerpt}</p>
        ${post.body.map((para) => `<p itemprop="articleBody">${para}</p>`).join("")}
      </article>
    `
    )
    .join("");

  blogStatus.textContent = `Showing ${posts.length} blog post(s), one for each product currently loaded.`;
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = allProducts.filter((product) => {
    const matchesText =
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    const matchesCategory = category === "all" || product.category === category;

    return matchesText && matchesCategory;
  });

  renderProducts(filtered);
  renderBlogPosts(filtered);
}

async function loadProducts() {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error("Failed to fetch sheet data");

    const csvText = await response.text();
    const parsed = parseCSV(csvText).map(formatProduct).filter((item) => item.name !== "Unnamed Product");

    allProducts = parsed.length ? parsed : FALLBACK_PRODUCTS;
    updateCategoryFilter(allProducts);
    renderProducts(allProducts);
    renderBlogPosts(allProducts);
    shopStatus.textContent = parsed.length
      ? "Products loaded from Google Sheet."
      : "Google Sheet was empty. Loaded demo products.";
  } catch (error) {
    allProducts = FALLBACK_PRODUCTS;
    updateCategoryFilter(allProducts);
    renderProducts(allProducts);
    renderBlogPosts(allProducts);
    shopStatus.textContent = "Could not load Google Sheet in this environment. Showing demo products.";
  }
}

searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);

loadProducts();
