// =====================================================
// Put your Google Apps Script Web App URL here
// Example:
// const API_URL = "https://script.google.com/macros/s/XXXXXXX/exec";
// =====================================================
const API_URL = "https://script.google.com/macros/s/AKfycbz6kmEtVTUS4twuZQzTk-hKRbvnjmrTLvcnb4JzriiQG3atu8xhnPJ1nIaknrOuVvQVKA/exec";

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

window.addEventListener("load", async function () {
  initializeCalculator();

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
  fromSelect.innerHTML = `<option value="">Select source</option>`;
  filterFrom.innerHTML = `<option value="">All Sources</option>`;

  sources.forEach(source => {
    fromSelect.innerHTML += `<option value="${escapeAttr(source)}">${escapeHtml(source)}</option>`;
    filterFrom.innerHTML += `<option value="${escapeAttr(source)}">${escapeHtml(source)}</option>`;
  });

  toSelect.innerHTML = `<option value="">Select user</option>`;
  filterTo.innerHTML = `<option value="">All Users</option>`;

  codes
    .filter(item => item.name !== "main")
    .forEach(item => {
      toSelect.innerHTML += `<option value="${escapeAttr(item.name)}">${escapeHtml(item.name)}</option>`;
      filterTo.innerHTML += `<option value="${escapeAttr(item.name)}">${escapeHtml(item.name)}</option>`;
    });
}

// Add custom source directly into the select.
// It becomes permanent after a product using it is saved.
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
// New fields added:
// calculatedWeightPrice
// sellingPrice
// =====================================================
productForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const product = {
    codeabare: document.getElementById("codeabare").value.trim(),
    nameproduit: document.getElementById("nameproduit").value.trim(),
    matiere: document.getElementById("matiere").value,
    contiter: Number(document.getElementById("contiter").value),
    price: Number(document.getElementById("price").value),
    calculatedWeightPrice: Number(document.getElementById("calculatedWeightPrice").value || 0),
    sellingPrice: Number(document.getElementById("sellingPrice").value || 0),
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
  document.getElementById("calculatedWeightPrice").value = "";
  document.getElementById("sellingPrice").value = "";
  document.getElementById("calcResult").classList.add("hidden");

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
    ? `<img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.nameproduit)}" onerror="this.parentElement.innerHTML='<span class=&quot;no-image&quot;>No Image</span>'">`
    : `<span class="no-image">No Image</span>`;

  card.innerHTML = `
    <div class="product-image">
      ${imgHtml}
    </div>

    <div class="product-body">
      <h4>${escapeHtml(product.nameproduit)}</h4>

      <p><strong>Codeabare:</strong> ${escapeHtml(product.codeabare)}</p>
      <p><strong>Matiere:</strong> ${escapeHtml(product.matiere)}</p>
      <p><strong>Quantity:</strong> ${escapeHtml(product.contiter)}</p>
      <p><strong>Product Price:</strong> ${escapeHtml(product.price)}</p>
      <p><strong>Calculated Weight Price:</strong> ${escapeHtml(product.calculatedWeightPrice)}</p>
      <p><strong>Selling Price:</strong> ${escapeHtml(product.sellingPrice)}</p>
      <p><strong>Image:</strong> ${escapeHtml(product.image)}</p>
      <p><strong>From:</strong> ${escapeHtml(product.from)}</p>
      <p><strong>Weidth:</strong> ${escapeHtml(product.weidth)}</p>
      <p><strong>To:</strong> ${escapeHtml(product.to)}</p>

      <div class="card-actions">
        ${
          isAdmin
            ? `
              <button class="edit-btn">Edit Product</button>
              <button class="receive-btn">Receive Product</button>
            `
            : `<button class="confirm-btn">Confirm</button>`
        }
      </div>
    </div>
  `;

  if (isAdmin) {
    card.querySelector(".edit-btn").addEventListener("click", function () {
      editProduct(product);
    });

    card.querySelector(".receive-btn").addEventListener("click", function () {
      receiveStock(product);
    });
  } else {
    card.querySelector(".confirm-btn").addEventListener("click", function () {
      userReceiveProduct(product);
    });
  }

  return card;
}

// =====================================================
// Edit product functionality
// Allows admin to update all product data
// =====================================================
async function editProduct(product) {
  const userOptions = codes
    .filter(item => item.name !== "main")
    .map(item => {
      const selected = item.name === product.to ? "selected" : "";
      return `<option value="${escapeAttr(item.name)}" ${selected}>${escapeHtml(item.name)}</option>`;
    })
    .join("");

  const sourceOptions = sources
    .map(source => {
      const selected = source === product.from ? "selected" : "";
      return `<option value="${escapeAttr(source)}" ${selected}>${escapeHtml(source)}</option>`;
    })
    .join("");

  const html = `
    <div class="edit-product-grid">
      <div>
        <label>Codeabare</label>
        <input id="editCodeabare" value="${escapeAttr(product.codeabare)}">
      </div>

      <div>
        <label>Product Name</label>
        <input id="editNameproduit" value="${escapeAttr(product.nameproduit)}">
      </div>

      <div>
        <label>Matiere</label>
        <select id="editMatiere">
          <option value="equide" ${product.matiere === "equide" ? "selected" : ""}>equide</option>
          <option value="solide" ${product.matiere === "solide" ? "selected" : ""}>solide</option>
        </select>
      </div>

      <div>
        <label>Quantity</label>
        <input id="editContiter" type="number" min="0" value="${escapeAttr(product.contiter)}">
      </div>

      <div>
        <label>Product Price</label>
        <input id="editPrice" type="number" step="0.001" min="0" value="${escapeAttr(product.price)}">
      </div>

      <div>
        <label>Calculated Weight Price</label>
        <input id="editCalculatedWeightPrice" type="number" step="0.001" min="0" value="${escapeAttr(product.calculatedWeightPrice)}">
      </div>

      <div>
        <label>Selling Price</label>
        <input id="editSellingPrice" type="number" step="0.001" min="0" value="${escapeAttr(product.sellingPrice)}">
      </div>

      <div>
        <label>Image</label>
        <input id="editImage" value="${escapeAttr(product.image)}">
      </div>

      <div>
        <label>From</label>
        <select id="editFrom">${sourceOptions}</select>
      </div>

      <div>
        <label>Weidth</label>
        <input id="editWeidth" value="${escapeAttr(product.weidth)}">
      </div>

      <div>
        <label>To</label>
        <select id="editTo">${userOptions}</select>
      </div>
    </div>
  `;

  const result = await Swal.fire({
    title: "Edit Product",
    html,
    width: 850,
    showCancelButton: true,
    confirmButtonText: "Save / Update",
    preConfirm: () => {
      const updatedProduct = {
        oldCodeabare: product.codeabare,
        codeabare: document.getElementById("editCodeabare").value.trim(),
        nameproduit: document.getElementById("editNameproduit").value.trim(),
        matiere: document.getElementById("editMatiere").value,
        contiter: Number(document.getElementById("editContiter").value),
        price: Number(document.getElementById("editPrice").value || 0),
        calculatedWeightPrice: Number(document.getElementById("editCalculatedWeightPrice").value || 0),
        sellingPrice: Number(document.getElementById("editSellingPrice").value || 0),
        image: document.getElementById("editImage").value.trim(),
        from: document.getElementById("editFrom").value,
        weidth: document.getElementById("editWeidth").value.trim(),
        to: document.getElementById("editTo").value
      };

      if (!updatedProduct.codeabare || !updatedProduct.nameproduit || !updatedProduct.matiere || updatedProduct.contiter < 0 || !updatedProduct.from || !updatedProduct.to) {
        Swal.showValidationMessage("Please complete all required fields.");
        return false;
      }

      return updatedProduct;
    }
  });

  if (!result.isConfirmed) return;

  await apiRequest("updateProduct", {
    product: result.value
  });

  Swal.fire("Updated", "Product updated successfully.", "success");

  await loadSources();
  await loadAllProducts();
  fillSelects();
}

// =====================================================
// Receive Product for admin
// This increases stock quantity instead of removing it
// =====================================================
async function receiveStock(product) {
  const { value: quantity } = await Swal.fire({
    title: "Receive Product",
    input: "number",
    inputLabel: `Enter received quantity for ${product.nameproduit}`,
    inputPlaceholder: "Example: 5",
    showCancelButton: true,
    inputAttributes: {
      min: 1,
      step: 1
    },
    inputValidator: value => {
      if (!value || Number(value) <= 0) {
        return "Please enter a valid quantity greater than 0";
      }
    }
  });

  if (!quantity) return;

  await apiRequest("receiveStock", {
    codeabare: product.codeabare,
    quantity: Number(quantity)
  });

  Swal.fire("Success", "Stock quantity increased.", "success");

  await loadAllProducts();
}

// =====================================================
// User dashboard
// Normal user confirm still decreases quantity and adds Result row
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
    inputPlaceholder: product.sellingPrice || "Example: 20",
    showCancelButton: true,
    inputAttributes: {
      min: 0,
      step: "0.001"
    },
    inputValue: product.sellingPrice || "",
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
// Integrated calculator logic
// Adapted from calculateur prix piece devises
// =====================================================
const calcCurrencies = ["TND", "EUR", "USD", "GBP", "TRY", "AED", "SAR", "CAD"];

const calcDefaultRatesToTnd = {
  TND: 1,
  EUR: 3.35,
  USD: 3.10,
  GBP: 3.95,
  TRY: 0.095,
  AED: 0.84,
  SAR: 0.83,
  CAD: 2.28
};

function initializeCalculator() {
  fillCalculatorCurrencies();
  buildCalculatorRates();

  document.getElementById("calculatePriceBtn").addEventListener("click", calculateWeightPrice);
  document.getElementById("resetCalcRatesBtn").addEventListener("click", resetCalculatorRates);
}

function fillCalculatorCurrencies() {
  ["calcShippingCurrency", "calcPieceCurrency", "calcOutputCurrency"].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = "";

    calcCurrencies.forEach(currency => {
      const option = document.createElement("option");
      option.value = currency;
      option.textContent = currency;
      select.appendChild(option);
    });
  });

  document.getElementById("calcShippingCurrency").value = "TND";
  document.getElementById("calcPieceCurrency").value = "EUR";
  document.getElementById("calcOutputCurrency").value = "TND";
}

function buildCalculatorRates() {
  const box = document.getElementById("calcRates");
  box.innerHTML = "";

  calcCurrencies.forEach(currency => {
    const div = document.createElement("div");
    div.className = "rate-box";

    div.innerHTML = `
      <label for="calcRate_${currency}">1 ${currency} = TND</label>
      <input 
        id="calcRate_${currency}" 
        type="number" 
        min="0" 
        step="0.000001" 
        value="${calcDefaultRatesToTnd[currency]}"
      >
    `;

    box.appendChild(div);
  });

  document.getElementById("calcRate_TND").readOnly = true;
}

function resetCalculatorRates() {
  calcCurrencies.forEach(currency => {
    document.getElementById("calcRate_" + currency).value = calcDefaultRatesToTnd[currency];
  });
}

function calcNum(id) {
  return Number(document.getElementById(id).value);
}

function calcRate(currency) {
  return Number(document.getElementById("calcRate_" + currency).value);
}

function calcToTnd(value, currency) {
  return value * calcRate(currency);
}

function calcFromTnd(valueTnd, currency) {
  return valueTnd / calcRate(currency);
}

function calcMoney(value, currency) {
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  return rounded.toLocaleString("fr-FR") + " " + currency;
}

function calculateWeightPrice() {
  const shippingPrice = calcNum("calcShippingPrice");
  const bagWeight = calcNum("calcBagWeight");
  const piecePrice = calcNum("calcPiecePrice");
  const pieceWeight = calcNum("calcPieceWeight");

  const shippingCurrency = document.getElementById("calcShippingCurrency").value;
  const pieceCurrency = document.getElementById("calcPieceCurrency").value;
  const outputCurrency = document.getElementById("calcOutputCurrency").value;
  const unit = document.getElementById("calcUnit").value || "kg";

  const error = document.getElementById("calcError");
  const result = document.getElementById("calcResult");

  error.style.display = "none";
  error.textContent = "";
  result.classList.add("hidden");

  const allNumbers = [
    shippingPrice,
    bagWeight,
    piecePrice,
    pieceWeight,
    ...calcCurrencies.map(calcRate)
  ];

  if (allNumbers.some(value => Number.isNaN(value))) {
    error.textContent = "Please fill all calculator fields with valid numbers.";
    error.style.display = "block";
    return;
  }

  if (bagWeight <= 0) {
    error.textContent = "Total bag weight must be greater than 0.";
    error.style.display = "block";
    return;
  }

  if (
    shippingPrice < 0 ||
    piecePrice < 0 ||
    pieceWeight < 0 ||
    calcCurrencies.some(currency => calcRate(currency) <= 0)
  ) {
    error.textContent = "Numbers and exchange rates must be greater than 0.";
    error.style.display = "block";
    return;
  }

  const shippingTnd = calcToTnd(shippingPrice, shippingCurrency);
  const piecePriceTnd = calcToTnd(piecePrice, pieceCurrency);

  const pricePerUnitTnd = shippingTnd / bagWeight;
  const pieceShippingTnd = pricePerUnitTnd * pieceWeight;
  const finalTnd = piecePriceTnd + pieceShippingTnd;

  const pricePerUnitOut = calcFromTnd(pricePerUnitTnd, outputCurrency);
  const pieceShippingOut = calcFromTnd(pieceShippingTnd, outputCurrency);
  const piecePriceOut = calcFromTnd(piecePriceTnd, outputCurrency);
  const finalOut = calcFromTnd(finalTnd, outputCurrency);

  document.getElementById("calcPricePerKg").textContent = calcMoney(pricePerUnitOut, outputCurrency) + " / " + unit;
  document.getElementById("calcPieceShipping").textContent = calcMoney(pieceShippingOut, outputCurrency);
  document.getElementById("calcOriginalPrice").textContent = calcMoney(piecePriceOut, outputCurrency);
  document.getElementById("calcFinalPrice").textContent = calcMoney(finalOut, outputCurrency);
  document.getElementById("calcFinalTnd").textContent = calcMoney(finalTnd, "TND");

  // Put calculated result into the new Add Product input field
  document.getElementById("calculatedWeightPrice").value =
    Math.round((finalOut + Number.EPSILON) * 1000) / 1000;

  // Helpful auto-fill: if product price is empty, fill it with original piece price
  if (!document.getElementById("price").value) {
    document.getElementById("price").value = piecePrice;
  }

  result.classList.remove("hidden");

  Swal.fire("Calculated", "Calculated weight price added to the product form.", "success");
}

// =====================================================
// Security helpers for displaying text safely
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

function escapeAttr(value) {
  return escapeHtml(value);
}