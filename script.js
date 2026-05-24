// =====================================================
// Put your Google Apps Script Web App URL here
// Example:
// const API_URL = "https://script.google.com/macros/s/XXXXXXX/exec";
// =====================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxkH7kFYX6v5g3-1PU94J8gmuEnP6aUmTRqL18cGBsS2u22fB6uoW9keJf3vyxRZt-rYA/exec";

// Global data
let currentUser = null;
let allProducts = [];
let codes = [];
let sources = [];

// Elements
const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");
const mainDashboard = document.getElementById("mainDashboard");
const userDashboard = document.getElementById("userDashboard");

const codeInput = document.getElementById("codeInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const dashboardTitle = document.getElementById("dashboardTitle");
const userInfo = document.getElementById("userInfo");

const productForm = document.getElementById("productForm");
const productsGrid = document.getElementById("productsGrid");
const userProductsGrid = document.getElementById("userProductsGrid");

const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");

const filterMatiere = document.getElementById("filterMatiere");
const filterFrom = document.getElementById("filterFrom");
const filterTo = document.getElementById("filterTo");

const resultsTableBody = document.getElementById("resultsTableBody");

// =====================================================
// API helper
// =====================================================
async function apiRequest(action, data = {}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action,
        ...data
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Unknown API error");
    }

    return result;
  } catch (error) {
    Swal.fire("Error", error.message, "error");
    throw error;
  }
}

// =====================================================
// Login
// =====================================================
loginBtn.addEventListener("click", login);

codeInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    login();
  }
});

async function login() {
  const code = codeInput.value.trim();

  if (!code) {
    Swal.fire("Missing Code", "Please enter your access code.", "warning");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Checking...";

  try {
    const result = await apiRequest("checkCode", { code });

    const user = result.user;

    localStorage.setItem("inventoryUser", JSON.stringify(user));
    currentUser = user;

    Swal.fire("Welcome", `Logged in as ${user.name}`, "success");

    await openDashboard();
  } catch (error) {
    localStorage.removeItem("inventoryUser");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}

// =====================================================
// Dashboard control
// =====================================================
async function openDashboard() {
  if (!currentUser) return;

  loginPage.classList.add("hidden");
  dashboardPage.classList.remove("hidden");

  dashboardTitle.textContent = currentUser.name === "main"
    ? "Main Dashboard"
    : "User Dashboard";

  userInfo.textContent = `Logged in as: ${currentUser.name}`;

  if (currentUser.name === "main") {
    mainDashboard.classList.remove("hidden");
    userDashboard.classList.add("hidden");

    await loadAdminData();
  } else {
    mainDashboard.classList.add("hidden");
    userDashboard.classList.remove("hidden");

    await loadUserProducts();
  }
}

logoutBtn.addEventListener("click", function () {
  localStorage.removeItem("inventoryUser");
  currentUser = null;
  location.reload();
});

// Restore login from localStorage
window.addEventListener("load", async function () {
  const savedUser = localStorage.getItem("inventoryUser");

  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    await openDashboard();
  }
});

// =====================================================
// Tabs
// =====================================================
document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", function () {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

// =====================================================
// Admin data
// =====================================================
async function loadAdminData() {
  await Promise.all([
    loadCodes(),
    loadSources(),
    loadAllProducts(),
    loadResults()
  ]);

  fillSelects();
}

async function loadCodes() {
  const result = await apiRequest("getCodes");
  codes = result.codes || [];
}

async function loadSources() {
  const result = await apiRequest("getSources");
  sources = result.sources || [];
}

async function loadAllProducts() {
  const result = await apiRequest("getProducts");
  allProducts = result.products || [];
  renderAdminProducts(allProducts);
}

async function loadResults() {
  const result = await apiRequest("getResults");
  const results = result.results || [];
  renderResults(results);
}

function fillSelects() {
  // Sources for product form
  fromSelect.innerHTML = `<option value="">Select source</option>`;
  filterFrom.innerHTML = `<option value="">All Sources</option>`;

  sources.forEach(source => {
    fromSelect.innerHTML += `<option value="${escapeHtml(source)}">${escapeHtml(source)}</option>`;
    filterFrom.innerHTML += `<option value="${escapeHtml(source)}">${escapeHtml(source)}</option>`;
  });

  // Users from Codes sheet except main
  toSelect.innerHTML = `<option value="">Select user</option>`;
  filterTo.innerHTML = `<option value="">All Users</option>`;

  codes
    .filter(item => item.name !== "main")
    .forEach(item => {
      toSelect.innerHTML += `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`;
      filterTo.innerHTML += `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`;
    });
}

// Add custom source directly into the select.
// It will become permanent after a product using it is saved.
document.getElementById("addSourceBtn").addEventListener("click", async function () {
  const { value } = await Swal.fire({
    title: "Add New Source",
    input: "text",
    inputLabel: "Source name",
    inputPlaceholder: "Example: souk",
    showCancelButton: true,
    inputValidator: value => {
      if (!value) return "Please enter a source name";
    }
  });

  if (value) {
    const cleanValue = value.trim();

    if (!sources.includes(cleanValue)) {
      sources.push(cleanValue);
    }

    fillSelects();
    fromSelect.value = cleanValue;
  }
});

// =====================================================
// Add product
// =====================================================
productForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const product = {
    codeabare: document.getElementById("codeabare").value.trim(),
    nameproduit: document.getElementById("nameproduit").value.trim(),
    matiere: document.getElementById("matiere").value,
    contiter: Number(document.getElementById("contiter").value),
    price: Number(document.getElementById("price").value),
    image: document.getElementById("image").value.trim(),
    from: fromSelect.value,
    weidth: document.getElementById("weidth").value.trim(),
    to: toSelect.value
  };

  if (!product.codeabare || !product.nameproduit || !product.matiere || !product.contiter || !product.from || !product.to) {
    Swal.fire("Missing Data", "Please complete all required fields.", "warning");
    return;
  }

  await apiRequest("addProduct", { product });

  Swal.fire("Success", "Product added successfully.", "success");

  productForm.reset();

  await loadSources();
  await loadAllProducts();
  fillSelects();
});

// =====================================================
// Render product cards
// =====================================================
function renderAdminProducts(products) {
  productsGrid.innerHTML = "";

  if (!products.length) {
    productsGrid.innerHTML = `<p>No products found.</p>`;
    return;
  }

  products.forEach(product => {
    const card = createProductCard(product, true);
    productsGrid.appendChild(card);
  });
}

function renderUserProducts(products) {
  userProductsGrid.innerHTML = "";

  if (!products.length) {
    userProductsGrid.innerHTML = `<p>No assigned products found.</p>`;
    return;
  }

  products.forEach(product => {
    const card = createProductCard(product, false);
    userProductsGrid.appendChild(card);
  });
}

function createProductCard(product, isAdmin) {
  const card = document.createElement("div");
  card.className = "product-card";

  const imgHtml = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.nameproduit)}" onerror="this.parentElement.innerHTML='<span class=&quot;no-image&quot;>No Image</span>'">`
    : `<span class="no-image">No Image</span>`;
  if (isAdmin) {
    card.innerHTML = `
    <div class="product-image">
      ${imgHtml}
    </div>

    <div class="product-body">
      <h4>${escapeHtml(product.nameproduit)}</h4>

      <p><strong>Codeabare:</strong> ${escapeHtml(product.codeabare)}</p>
      <p><strong>Matiere:</strong> ${escapeHtml(product.matiere)}</p>
      <p><strong>Contiter:</strong> ${escapeHtml(product.contiter)}</p>
      <p><strong>Price:</strong> ${escapeHtml(product.price)}</p>
      <p><strong>From:</strong> ${escapeHtml(product.from)}</p>
      <p><strong>Weidth:</strong> ${escapeHtml(product.weidth)}</p>
      <p><strong>To:</strong> ${escapeHtml(product.to)}</p>

      <div class="card-actions">
        ${
          isAdmin 
          ? `<button class="remove-btn">Remove / Decrease</button>` 
          : `<button class="receive-btn">Receive Product</button>`
        }
      </div>
    </div>
  `;

    card.querySelector(".remove-btn").addEventListener("click", function () {
      adminRemoveProduct(product);
    });
  } else {
    card.innerHTML = `
    <div class="product-image">
      ${imgHtml}
    </div>

    <div class="product-body">
      <h4>${escapeHtml(product.nameproduit)}</h4>

      <p><strong>Codeabare:</strong> ${escapeHtml(product.codeabare)}</p>
      <p><strong>Matiere:</strong> ${escapeHtml(product.matiere)}</p>
      <p><strong>Contiter:</strong> ${escapeHtml(product.contiter)}</p>
      <p><strong>Price:</strong> ${escapeHtml(product.price)}</p>
      <p><strong>From:</strong> ${escapeHtml(product.from)}</p>
      <p><strong>Weidth:</strong> ${escapeHtml(product.weidth)}</p>
      <p><strong>To:</strong> ${escapeHtml(product.to)}</p>

      <div class="card-actions">
        ${
          isAdmin 
          ? `<button class="remove-btn">Remove / Decrease</button>` 
          : `<button class="receive-btn">Receive Product</button>`
        }
      </div>
    </div>
  `;

    card.querySelector(".receive-btn").addEventListener("click", function () {
      userReceiveProduct(product);
    });
  }

  return card;
}

// =====================================================
// Admin remove/decrease product
// =====================================================
async function adminRemoveProduct(product) {
  const confirm = await Swal.fire({
    title: "Confirm Action",
    text: Number(product.contiter) > 1
      ? "This will decrease quantity by 1."
      : "Quantity is 1. This will delete the product.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, continue"
  });

  if (!confirm.isConfirmed) return;

  await apiRequest("updateQuantity", {
    codeabare: product.codeabare
  });

  Swal.fire("Done", "Product quantity updated.", "success");

  await loadAllProducts();
}

// =====================================================
// User dashboard
// =====================================================
async function loadUserProducts() {
  const result = await apiRequest("getProductsByUser", {
    name: currentUser.name
  });

  renderUserProducts(result.products || []);
}

async function userReceiveProduct(product) {
  const confirm = await Swal.fire({
    title: "Receive Product?",
    text: `Confirm receiving ${product.nameproduit}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes"
  });

  if (!confirm.isConfirmed) return;

  const { value: finalPrice } = await Swal.fire({
    title: "Final Selling Price",
    input: "number",
    inputLabel: "Enter the real/final selling price",
    inputPlaceholder: "Example: 20",
    showCancelButton: true,
    inputAttributes: {
      min: 0,
      step: "0.01"
    },
    inputValidator: value => {
      if (!value || Number(value) < 0) {
        return "Please enter a valid price";
      }
    }
  });

  if (!finalPrice) return;

  await apiRequest("receiveProduct", {
    codeabare: product.codeabare,
    finalPrice: Number(finalPrice),
    to: currentUser.name
  });

  Swal.fire("Success", "Product received and result saved.", "success");

  await loadUserProducts();
}

// =====================================================
// Filters
// =====================================================
filterMatiere.addEventListener("change", applyFilters);
filterFrom.addEventListener("change", applyFilters);
filterTo.addEventListener("change", applyFilters);

document.getElementById("clearFiltersBtn").addEventListener("click", function () {
  filterMatiere.value = "";
  filterFrom.value = "";
  filterTo.value = "";
  applyFilters();
});

function applyFilters() {
  const matiereValue = filterMatiere.value;
  const fromValue = filterFrom.value;
  const toValue = filterTo.value;

  const filtered = allProducts.filter(product => {
    return (
      (!matiereValue || product.matiere === matiereValue) &&
      (!fromValue || product.from === fromValue) &&
      (!toValue || product.to === toValue)
    );
  });

  renderAdminProducts(filtered);
}

// =====================================================
// Results table
// =====================================================
function renderResults(results) {
  resultsTableBody.innerHTML = "";

  if (!results.length) {
    resultsTableBody.innerHTML = `
      <tr>
        <td colspan="5">No results found.</td>
      </tr>
    `;
    return;
  }

  results.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(row.Date)}</td>
      <td>${escapeHtml(row.Codeabare)}</td>
      <td>${escapeHtml(row.nameproduit)}</td>
      <td>${escapeHtml(row.price)}</td>
      <td>${escapeHtml(row.to)}</td>
    `;

    resultsTableBody.appendChild(tr);
  });
}

// =====================================================
// Refresh buttons
// =====================================================
document.getElementById("refreshProductsBtn").addEventListener("click", loadAllProducts);
document.getElementById("refreshUserProductsBtn").addEventListener("click", loadUserProducts);
document.getElementById("refreshResultsBtn").addEventListener("click", loadResults);

// =====================================================
// Security helper for displaying text safely
// =====================================================
function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}