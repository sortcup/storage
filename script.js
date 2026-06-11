// =====================================================
// Put your Google Apps Script Web App URL here
// =====================================================
const API_URL = "https://script.google.com/macros/s/AKfycbw9yIW8gopyX9cADp4_psmhvt-pm74zmFeb_EJdd9nktJJvajsTaQyZhiK2Am3ZWcwWIg/exec";

// Global data
let currentUser = null;
let allProducts = [];
let codes = [];
let sources = [];
let categories = [];
let currentLanguage = localStorage.getItem("inventoryLanguage") || "en";

// Elements
const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");
const mainDashboard = document.getElementById("mainDashboard");
const userDashboard = document.getElementById("userDashboard");

const codeInput = document.getElementById("codeInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const languageBtn = document.getElementById("languageBtn");

const dashboardTitle = document.getElementById("dashboardTitle");
const userInfo = document.getElementById("userInfo");

const productForm = document.getElementById("productForm");
const productsGrid = document.getElementById("productsGrid");
const userProductsGrid = document.getElementById("userProductsGrid");

const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");

const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const filterMatiere = document.getElementById("filterMatiere");
const filterFrom = document.getElementById("filterFrom");
const filterTo = document.getElementById("filterTo");

const categoryList = document.getElementById("categoryList");
const resultsTableBody = document.getElementById("resultsTableBody");

// =====================================================
// Translations
// =====================================================
const translations = {
  en: {
    languageBtn: "العربية",
    loginTitle: "Inventory Login",
    loginSubtitle: "Enter your access code to continue",
    codePlaceholder: "Enter code",
    loginBtn: "Login",
    logout: "Logout",
    mainDashboard: "Main Dashboard",
    userDashboard: "User Dashboard",
    loggedInAs: "Logged in as",
    addProductTab: "Add Product",
    allProductsTab: "All Products",
    resultsTab: "Results",
    addNewProduct: "Add New Product",
    codeabare: "Codeabare",
    productName: "Product Name",
    category: "Category",
    categoryPlaceholder: "Example: gaming, drinks, cables",
    matiere: "Matiere",
    quantity: "Quantity",
    productPrice: "Product Price",
    price: "Price",
    priceByWeight: "Price Calculated Based on Weight",
    useCalculator: "Use calculator",
    sellingPrice: "Selling Price",
    sellingPricePlaceholder: "Enter final selling price",
    image: "Image",
    from: "From",
    weidth: "Weidth",
    to: "To",
    addProductBtn: "Add Product",
    searchTitle: "Search / Recherch",
    searchPlaceholder: "Search by name, code, category...",
    allCategories: "All Categories",
    allMatiere: "All Matiere",
    allSources: "All Sources",
    allUsers: "All Users",
    clearFilters: "Clear Filters",
    allProducts: "All Products",
    refresh: "Refresh",
    resultTransactions: "Result Transactions",
    date: "Date",
    myProducts: "My Products",
    editProduct: "Edit Product",
    receiveProduct: "Receive Product",
    confirm: "Confirm",
    noProducts: "No products found.",
    noAssignedProducts: "No assigned products found.",
    noResults: "No results found.",
    missingCode: "Missing Code",
    enterCode: "Please enter your access code.",
    welcome: "Welcome",
    missingData: "Missing Data",
    completeFields: "Please complete all required fields.",
    success: "Success",
    productAdded: "Product added successfully.",
    updated: "Updated",
    productUpdated: "Product updated successfully.",
    receiveStockTitle: "Receive Product",
    receivedQtyLabel: "Enter received quantity",
    validQty: "Please enter a valid quantity greater than 0",
    stockIncreased: "Stock quantity increased.",
    receiveQuestion: "Receive Product?",
    finalSellingPrice: "Final Selling Price",
    enterFinalPrice: "Enter the real/final selling price",
    validPrice: "Please enter a valid price",
    productReceivedSaved: "Product received and result saved.",
    calculated: "Calculated",
    calculatedAdded: "Calculated weight price added to the product form.",
    addSourceTitle: "Add New Source",
    sourceName: "Source name",
    sourceExample: "Example: souk",
    enterSource: "Please enter a source name",
    saveUpdate: "Save / Update",
    cancel: "Cancel"
  },
  ar: {
    languageBtn: "English",
    loginTitle: "تسجيل الدخول للمخزون",
    loginSubtitle: "أدخل كود الدخول للمتابعة",
    codePlaceholder: "أدخل الكود",
    loginBtn: "دخول",
    logout: "تسجيل الخروج",
    mainDashboard: "لوحة التحكم الرئيسية",
    userDashboard: "لوحة المستخدم",
    loggedInAs: "تم الدخول باسم",
    addProductTab: "إضافة منتج",
    allProductsTab: "كل المنتجات",
    resultsTab: "النتائج",
    addNewProduct: "إضافة منتج جديد",
    codeabare: "كود البار",
    productName: "اسم المنتج",
    category: "الصنف",
    categoryPlaceholder: "مثال: ألعاب، مشروبات، كابلات",
    matiere: "المادة",
    quantity: "الكمية",
    productPrice: "سعر المنتج",
    price: "السعر",
    priceByWeight: "السعر المحسوب حسب الوزن",
    useCalculator: "استعمل الحاسبة",
    sellingPrice: "سعر البيع",
    sellingPricePlaceholder: "أدخل سعر البيع النهائي",
    image: "الصورة",
    from: "المصدر",
    weidth: "الوزن",
    to: "إلى",
    addProductBtn: "إضافة المنتج",
    searchTitle: "بحث",
    searchPlaceholder: "ابحث بالاسم، الكود، الصنف...",
    allCategories: "كل الأصناف",
    allMatiere: "كل المواد",
    allSources: "كل المصادر",
    allUsers: "كل المستخدمين",
    clearFilters: "مسح الفلاتر",
    allProducts: "كل المنتجات",
    refresh: "تحديث",
    resultTransactions: "عمليات البيع",
    date: "التاريخ",
    myProducts: "منتجاتي",
    editProduct: "تعديل المنتج",
    receiveProduct: "استلام منتج",
    confirm: "تأكيد",
    noProducts: "لا توجد منتجات.",
    noAssignedProducts: "لا توجد منتجات مخصصة لك.",
    noResults: "لا توجد نتائج.",
    missingCode: "الكود غير موجود",
    enterCode: "يرجى إدخال كود الدخول.",
    welcome: "مرحبا",
    missingData: "بيانات ناقصة",
    completeFields: "يرجى إكمال كل الحقول المطلوبة.",
    success: "تم بنجاح",
    productAdded: "تمت إضافة المنتج بنجاح.",
    updated: "تم التحديث",
    productUpdated: "تم تحديث المنتج بنجاح.",
    receiveStockTitle: "استلام منتج",
    receivedQtyLabel: "أدخل الكمية المستلمة",
    validQty: "يرجى إدخال كمية صحيحة أكبر من 0",
    stockIncreased: "تمت زيادة كمية المخزون.",
    receiveQuestion: "تأكيد استلام المنتج؟",
    finalSellingPrice: "سعر البيع النهائي",
    enterFinalPrice: "أدخل سعر البيع الحقيقي/النهائي",
    validPrice: "يرجى إدخال سعر صحيح",
    productReceivedSaved: "تم تأكيد المنتج وتسجيل العملية.",
    calculated: "تم الحساب",
    calculatedAdded: "تمت إضافة السعر المحسوب إلى فورم المنتج.",
    addSourceTitle: "إضافة مصدر جديد",
    sourceName: "اسم المصدر",
    sourceExample: "مثال: souk",
    enterSource: "يرجى إدخال اسم المصدر",
    saveUpdate: "حفظ / تحديث",
    cancel: "إلغاء"
  }
};

function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

  languageBtn.textContent = t("languageBtn");

  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  updateDashboardText();

  if (allProducts.length) {
    applyFilters();
  }
}

function updateDashboardText() {
  if (!currentUser) return;

  dashboardTitle.textContent =
    currentUser.name === "main" ? t("mainDashboard") : t("userDashboard");

  userInfo.textContent = `${t("loggedInAs")}: ${currentUser.name}`;
}

languageBtn.addEventListener("click", function () {
  currentLanguage = currentLanguage === "en" ? "ar" : "en";
  localStorage.setItem("inventoryLanguage", currentLanguage);
  applyLanguage();
});

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
    Swal.fire(t("missingCode"), t("enterCode"), "warning");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Checking...";

  try {
    const result = await apiRequest("checkCode", { code });
    const user = result.user;

    localStorage.setItem("inventoryUser", JSON.stringify(user));
    currentUser = user;

    Swal.fire(t("welcome"), `${t("loggedInAs")}: ${user.name}`, "success");

    await openDashboard();
  } catch (error) {
    localStorage.removeItem("inventoryUser");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = t("loginBtn");
  }
}

// =====================================================
// Dashboard control
// =====================================================
async function openDashboard() {
  if (!currentUser) return;

  loginPage.classList.add("hidden");
  dashboardPage.classList.remove("hidden");

  updateDashboardText();

  if (currentUser.name === "main") {
    mainDashboard.classList.remove("hidden");
    userDashboard.classList.add("hidden");
    await loadAdminData();
  } else {
    mainDashboard.classList.add("hidden");
    userDashboard.classList.remove("hidden");
    await loadUserProducts();
  }

  applyLanguage();
}

logoutBtn.addEventListener("click", function () {
  localStorage.removeItem("inventoryUser");
  currentUser = null;
  location.reload();
});

window.addEventListener("load", async function () {
  applyLanguage();
  fillCurrencies();
  buildRates();

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
    loadCategories(),
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

async function loadCategories() {
  const result = await apiRequest("getCategories");
  categories = result.categories || [];
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
  fromSelect.innerHTML = `<option value="">${t("allSources")}</option>`;
  filterFrom.innerHTML = `<option value="">${t("allSources")}</option>`;

  sources.forEach(source => {
    fromSelect.innerHTML += `<option value="${escapeAttr(source)}">${escapeHtml(source)}</option>`;
    filterFrom.innerHTML += `<option value="${escapeAttr(source)}">${escapeHtml(source)}</option>`;
  });

  toSelect.innerHTML = `<option value="">${t("allUsers")}</option>`;
  filterTo.innerHTML = `<option value="">${t("allUsers")}</option>`;

  codes
    .filter(item => item.name !== "main")
    .forEach(item => {
      toSelect.innerHTML += `<option value="${escapeAttr(item.name)}">${escapeHtml(item.name)}</option>`;
      filterTo.innerHTML += `<option value="${escapeAttr(item.name)}">${escapeHtml(item.name)}</option>`;
    });

  filterCategory.innerHTML = `<option value="">${t("allCategories")}</option>`;
  categoryList.innerHTML = "";

  categories.forEach(category => {
    filterCategory.innerHTML += `<option value="${escapeAttr(category)}">${escapeHtml(category)}</option>`;
    categoryList.innerHTML += `<option value="${escapeAttr(category)}"></option>`;
  });
}

document.getElementById("addSourceBtn").addEventListener("click", async function () {
  const { value } = await Swal.fire({
    title: t("addSourceTitle"),
    input: "text",
    inputLabel: t("sourceName"),
    inputPlaceholder: t("sourceExample"),
    showCancelButton: true,
    inputValidator: value => {
      if (!value) return t("enterSource");
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
// Includes: category, priceByWeight, sellingPrice
// =====================================================
productForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const product = {
    codeabare: document.getElementById("codeabare").value.trim(),
    nameproduit: document.getElementById("nameproduit").value.trim(),
    category: document.getElementById("category").value.trim(),
    matiere: document.getElementById("matiere").value,
    contiter: Number(document.getElementById("contiter").value),
    price: Number(document.getElementById("price").value),
    priceByWeight: Number(document.getElementById("priceByWeight").value || 0),
    sellingPrice: Number(document.getElementById("sellingPrice").value || 0),
    image: document.getElementById("image").value.trim(),
    from: fromSelect.value,
    weidth: document.getElementById("weidth").value.trim(),
    to: toSelect.value
  };

  if (
    !product.codeabare ||
    !product.nameproduit ||
    !product.category ||
    !product.matiere ||
    !product.contiter ||
    !product.from ||
    !product.to
  ) {
    Swal.fire(t("missingData"), t("completeFields"), "warning");
    return;
  }

  await apiRequest("addProduct", { product });

  Swal.fire(t("success"), t("productAdded"), "success");

  productForm.reset();
  document.getElementById("priceByWeight").value = "";
  document.getElementById("sellingPrice").value = "";
  document.getElementById("result").style.display = "none";

  await loadSources();
  await loadCategories();
  await loadAllProducts();
  fillSelects();
});

// =====================================================
// Render product cards
// =====================================================
function renderAdminProducts(products) {
  productsGrid.innerHTML = "";

  if (!products.length) {
    productsGrid.innerHTML = `<p>${t("noProducts")}</p>`;
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
    userProductsGrid.innerHTML = `<p>${t("noAssignedProducts")}</p>`;
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

      <p><strong>${t("codeabare")}:</strong> ${escapeHtml(product.codeabare)}</p>
      <p><strong>${t("category")}:</strong> ${escapeHtml(product.category)}</p>
      <p><strong>${t("matiere")}:</strong> ${escapeHtml(product.matiere)}</p>
      <p><strong>${t("quantity")}:</strong> ${escapeHtml(product.contiter)}</p>
      <p><strong>${t("productPrice")}:</strong> ${escapeHtml(product.price)}</p>
      <p><strong>${t("priceByWeight")}:</strong> ${escapeHtml(product.priceByWeight)}</p>
      <p><strong>${t("sellingPrice")}:</strong> ${escapeHtml(product.sellingPrice)}</p>
      <p><strong>${t("image")}:</strong> ${escapeHtml(product.image)}</p>
      <p><strong>${t("from")}:</strong> ${escapeHtml(product.from)}</p>
      <p><strong>${t("weidth")}:</strong> ${escapeHtml(product.weidth)}</p>
      <p><strong>${t("to")}:</strong> ${escapeHtml(product.to)}</p>

      <div class="card-actions">
        ${
          isAdmin
            ? `
              <button class="edit-btn">${t("editProduct")}</button>
              <button class="receive-btn">${t("receiveProduct")}</button>
            `
            : `<button class="confirm-btn">${t("confirm")}</button>`
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
// Edit product
// Includes category, priceByWeight, sellingPrice
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
        <label>${t("codeabare")}</label>
        <input id="editCodeabare" value="${escapeAttr(product.codeabare)}">
      </div>

      <div>
        <label>${t("productName")}</label>
        <input id="editNameproduit" value="${escapeAttr(product.nameproduit)}">
      </div>

      <div>
        <label>${t("category")}</label>
        <input id="editCategory" value="${escapeAttr(product.category)}">
      </div>

      <div>
        <label>${t("matiere")}</label>
        <select id="editMatiere">
          <option value="equide" ${product.matiere === "equide" ? "selected" : ""}>equide</option>
          <option value="solide" ${product.matiere === "solide" ? "selected" : ""}>solide</option>
        </select>
      </div>

      <div>
        <label>${t("quantity")}</label>
        <input id="editContiter" type="number" min="0" value="${escapeAttr(product.contiter)}">
      </div>

      <div>
        <label>${t("productPrice")}</label>
        <input id="editPrice" type="number" step="0.001" min="0" value="${escapeAttr(product.price)}">
      </div>

      <div>
        <label>${t("priceByWeight")}</label>
        <input id="editPriceByWeight" type="number" step="0.001" min="0" value="${escapeAttr(product.priceByWeight)}">
      </div>

      <div>
        <label>${t("sellingPrice")}</label>
        <input id="editSellingPrice" type="number" step="0.001" min="0" value="${escapeAttr(product.sellingPrice)}">
      </div>

      <div>
        <label>${t("image")}</label>
        <input id="editImage" value="${escapeAttr(product.image)}">
      </div>

      <div>
        <label>${t("from")}</label>
        <select id="editFrom">${sourceOptions}</select>
      </div>

      <div>
        <label>${t("weidth")}</label>
        <input id="editWeidth" value="${escapeAttr(product.weidth)}">
      </div>

      <div>
        <label>${t("to")}</label>
        <select id="editTo">${userOptions}</select>
      </div>
    </div>
  `;

  const result = await Swal.fire({
    title: t("editProduct"),
    html,
    width: 850,
    showCancelButton: true,
    confirmButtonText: t("saveUpdate"),
    cancelButtonText: t("cancel"),
    preConfirm: () => {
      const updatedProduct = {
        oldCodeabare: product.codeabare,
        codeabare: document.getElementById("editCodeabare").value.trim(),
        nameproduit: document.getElementById("editNameproduit").value.trim(),
        category: document.getElementById("editCategory").value.trim(),
        matiere: document.getElementById("editMatiere").value,
        contiter: Number(document.getElementById("editContiter").value),
        price: Number(document.getElementById("editPrice").value || 0),
        priceByWeight: Number(document.getElementById("editPriceByWeight").value || 0),
        sellingPrice: Number(document.getElementById("editSellingPrice").value || 0),
        image: document.getElementById("editImage").value.trim(),
        from: document.getElementById("editFrom").value,
        weidth: document.getElementById("editWeidth").value.trim(),
        to: document.getElementById("editTo").value
      };

      if (
        !updatedProduct.codeabare ||
        !updatedProduct.nameproduit ||
        !updatedProduct.category ||
        !updatedProduct.matiere ||
        updatedProduct.contiter < 0 ||
        !updatedProduct.from ||
        !updatedProduct.to
      ) {
        Swal.showValidationMessage(t("completeFields"));
        return false;
      }

      return updatedProduct;
    }
  });

  if (!result.isConfirmed) return;

  await apiRequest("updateProduct", {
    product: result.value
  });

  Swal.fire(t("updated"), t("productUpdated"), "success");

  await loadSources();
  await loadCategories();
  await loadAllProducts();
  fillSelects();
}

// =====================================================
// Admin Receive Product: increases stock quantity
// =====================================================
async function receiveStock(product) {
  const { value: quantity } = await Swal.fire({
    title: t("receiveStockTitle"),
    input: "number",
    inputLabel: `${t("receivedQtyLabel")} - ${product.nameproduit}`,
    inputPlaceholder: "Example: 5",
    showCancelButton: true,
    inputAttributes: {
      min: 1,
      step: 1
    },
    inputValidator: value => {
      if (!value || Number(value) <= 0) {
        return t("validQty");
      }
    }
  });

  if (!quantity) return;

  await apiRequest("receiveStock", {
    codeabare: product.codeabare,
    quantity: Number(quantity)
  });

  Swal.fire(t("success"), t("stockIncreased"), "success");

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
    title: t("receiveQuestion"),
    text: `${product.nameproduit}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: t("confirm"),
    cancelButtonText: t("cancel")
  });

  if (!confirm.isConfirmed) return;

  const { value: finalPrice } = await Swal.fire({
    title: t("finalSellingPrice"),
    input: "number",
    inputLabel: t("enterFinalPrice"),
    inputPlaceholder: product.sellingPrice || "Example: 20",
    showCancelButton: true,
    inputAttributes: {
      min: 0,
      step: "0.001"
    },
    inputValue: product.sellingPrice || "",
    inputValidator: value => {
      if (!value || Number(value) < 0) {
        return t("validPrice");
      }
    }
  });

  if (!finalPrice) return;

  await apiRequest("receiveProduct", {
    codeabare: product.codeabare,
    finalPrice: Number(finalPrice),
    to: currentUser.name
  });

  Swal.fire(t("success"), t("productReceivedSaved"), "success");

  await loadUserProducts();
}

// =====================================================
// Search / filters
// Includes category search and category filter
// =====================================================
searchInput.addEventListener("input", applyFilters);
filterCategory.addEventListener("change", applyFilters);
filterMatiere.addEventListener("change", applyFilters);
filterFrom.addEventListener("change", applyFilters);
filterTo.addEventListener("change", applyFilters);

document.getElementById("clearFiltersBtn").addEventListener("click", function () {
  searchInput.value = "";
  filterCategory.value = "";
  filterMatiere.value = "";
  filterFrom.value = "";
  filterTo.value = "";
  applyFilters();
});

function applyFilters() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const categoryValue = filterCategory.value;
  const matiereValue = filterMatiere.value;
  const fromValue = filterFrom.value;
  const toValue = filterTo.value;

  const filtered = allProducts.filter(product => {
    const searchableText = [
      product.codeabare,
      product.nameproduit,
      product.category,
      product.matiere,
      product.price,
      product.priceByWeight,
      product.sellingPrice,
      product.from,
      product.weidth,
      product.to
    ].join(" ").toLowerCase();

    return (
      (!searchValue || searchableText.includes(searchValue)) &&
      (!categoryValue || product.category === categoryValue) &&
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
        <td colspan="5">${t("noResults")}</td>
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
// Attached calculator logic
// Main logic kept, only added line to write finalOut into priceByWeight
// =====================================================
const currencies = ['TND', 'EUR', 'USD', 'GBP', 'TRY', 'AED', 'SAR', 'CAD'];

const defaultRatesToTnd = {
  TND: 1,
  EUR: 3.35,
  USD: 3.10,
  GBP: 3.95,
  TRY: 0.095,
  AED: 0.84,
  SAR: 0.83,
  CAD: 2.28
};

function fillCurrencies() {
  ['shippingCurrency', 'pieceCurrency', 'outputCurrency'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '';
    currencies.forEach(cur => {
      const opt = document.createElement('option');
      opt.value = cur;
      opt.textContent = cur;
      select.appendChild(opt);
    });
  });
  document.getElementById('shippingCurrency').value = 'TND';
  document.getElementById('pieceCurrency').value = 'EUR';
  document.getElementById('outputCurrency').value = 'TND';
}

function buildRates() {
  const box = document.getElementById('rates');
  box.innerHTML = '';
  currencies.forEach(cur => {
    const div = document.createElement('div');
    div.className = 'rateBox';
    div.innerHTML = `
      <label for="rate_${cur}">1 ${cur} = TND</label>
      <input id="rate_${cur}" type="number" min="0" step="0.000001" value="${defaultRatesToTnd[cur]}">
    `;
    box.appendChild(div);
  });
  document.getElementById('rate_TND').readOnly = true;
}

function resetRates() {
  currencies.forEach(cur => document.getElementById('rate_' + cur).value = defaultRatesToTnd[cur]);
}

function num(id) {
  return Number(document.getElementById(id).value);
}

function rate(cur) {
  return Number(document.getElementById('rate_' + cur).value);
}

function toTnd(value, cur) {
  return value * rate(cur);
}

function fromTnd(valueTnd, cur) {
  return valueTnd / rate(cur);
}

function money(value, currency) {
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  return rounded.toLocaleString('fr-FR') + ' ' + currency;
}

function calculate() {
  const shippingPrice = num('shippingPrice');
  const bagWeight = num('bagWeight');
  const piecePrice = num('piecePrice');
  const pieceWeight = num('pieceWeight');
  const shippingCurrency = document.getElementById('shippingCurrency').value;
  const pieceCurrency = document.getElementById('pieceCurrency').value;
  const outputCurrency = document.getElementById('outputCurrency').value;
  const unit = document.getElementById('unit').value || 'kg';
  const error = document.getElementById('error');
  const result = document.getElementById('result');
  error.style.display = 'none';
  result.style.display = 'none';

  const allNums = [shippingPrice, bagWeight, piecePrice, pieceWeight, ...currencies.map(rate)];
  if (allNums.some(v => Number.isNaN(v))) {
    error.textContent = 'عبي الخانات الكل بأرقام صحيحة.';
    error.style.display = 'block';
    return;
  }

  if (bagWeight <= 0) {
    error.textContent = 'ميزان الحقيبة لازم يكون أكبر من 0.';
    error.style.display = 'block';
    return;
  }

  if (shippingPrice < 0 || piecePrice < 0 || pieceWeight < 0 || currencies.some(cur => rate(cur) <= 0)) {
    error.textContent = 'الأرقام وأسعار الصرف لازم يكونوا أكبر من 0، وما ينجمش يكونوا ناقصين.';
    error.style.display = 'block';
    return;
  }

  const shippingTnd = toTnd(shippingPrice, shippingCurrency);
  const piecePriceTnd = toTnd(piecePrice, pieceCurrency);
  const pricePerUnitTnd = shippingTnd / bagWeight;
  const pieceShippingTnd = pricePerUnitTnd * pieceWeight;
  const finalTnd = piecePriceTnd + pieceShippingTnd;

  const pricePerUnitOut = fromTnd(pricePerUnitTnd, outputCurrency);
  const pieceShippingOut = fromTnd(pieceShippingTnd, outputCurrency);
  const piecePriceOut = fromTnd(piecePriceTnd, outputCurrency);
  const finalOut = fromTnd(finalTnd, outputCurrency);

  document.getElementById('pricePerKg').textContent = money(pricePerUnitOut, outputCurrency) + ' / ' + unit;
  document.getElementById('pieceShipping').textContent = money(pieceShippingOut, outputCurrency);
  document.getElementById('originalPrice').textContent = money(piecePriceOut, outputCurrency);
  document.getElementById('finalPrice').textContent = money(finalOut, outputCurrency);
  document.getElementById('finalTnd').textContent = money(finalTnd, 'TND');
  result.style.display = 'block';

  // Required integration: send calculator result to Add Product input
  document.getElementById("priceByWeight").value =
    Math.round((finalOut + Number.EPSILON) * 1000) / 1000;

  Swal.fire(t("calculated"), t("calculatedAdded"), "success");
}

// =====================================================
// Security helpers
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