const SHEET_CSV_URL = "";

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

const BLOG_TEMPLATES = [
  {
    title: (product) => `How to choose the right ${product.name}`,
    excerpt: (product) => `A simple guide for buyers comparing ${product.category.toLowerCase()} options, performance, and value before purchase.`
  },
  {
    title: (product) => `${product.name}: maintenance tips for long life`,
    excerpt: (product) => `Best practices to keep your ${product.name.toLowerCase()} efficient and reliable for daily use.`
  },
  {
    title: (product) => `${product.name} use-cases for homes and businesses`,
    excerpt: (product) => `Practical applications and setup ideas to get maximum benefit from your ${product.category.toLowerCase()} purchase.`
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
  const [headerLine, ...rows] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];

  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  return rows.map((row) => {
    const columns = row.split(",");
    return headers.reduce((item, header, index) => {
      item[header] = (columns[index] || "").trim();
      return item;
    }, {});
  });
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

function renderBlogPosts(products) {
  if (!blogList || !blogStatus) return;

  const posts = products.flatMap((product) =>
    BLOG_TEMPLATES.map((template, index) => ({
      title: template.title(product),
      excerpt: template.excerpt(product),
      category: product.category,
      image: product.image,
      slug: `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-post-${index + 1}`
    }))
  );

  if (!posts.length) {
    blogList.innerHTML = "";
    blogStatus.textContent = "No blog posts available yet.";
    return;
  }

  blogList.innerHTML = posts
    .map(
      (post) => `
      <article class="blog-card" itemscope itemtype="https://schema.org/BlogPosting">
        ${post.image ? `<img src="${post.image}" alt="${post.title}" loading="lazy" itemprop="image" />` : ""}
        <span class="category-chip">${post.category}</span>
        <h3 itemprop="headline">${post.title}</h3>
        <p itemprop="description">${post.excerpt}</p>
        <a class="blog-link" href="#${post.slug}" aria-label="Read post: ${post.title}">Read post</a>
      </article>
    `
    )
    .join("");

  blogStatus.textContent = `Showing ${posts.length} blog post idea(s) from current products.`;
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
  if (!SHEET_CSV_URL) {
    allProducts = FALLBACK_PRODUCTS;
    updateCategoryFilter(allProducts);
    renderProducts(allProducts);
    renderBlogPosts(allProducts);
    shopStatus.textContent = "Loaded demo products. Add your Google Sheet CSV URL in script.js to go live.";
    return;
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error("Failed to fetch sheet data");

    const csvText = await response.text();
    const parsed = parseCSV(csvText).map(formatProduct);

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
    shopStatus.textContent = "Could not load Google Sheet. Showing demo products.";
  }
}

searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);

loadProducts();
