// =====================================================
// Google Apps Script API for Inventory Dashboard
// Sheets required:
// 1. Produit
// 2. Codes
// 3. Result
// =====================================================

const SHEET_PRODUIT = "Produit";
const SHEET_CODES = "Codes";
const SHEET_RESULT = "Result";

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// =====================================================
// Web App entry points
// =====================================================
function doGet(e) {
  return jsonResponse({
    success: true,
    message: "Inventory API is running"
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "checkCode") {
      return jsonResponse(checkCode(data.code));
    }

    if (action === "getProducts") {
      return jsonResponse(getProducts());
    }

    if (action === "getProductsByUser") {
      return jsonResponse(getProductsByUser(data.name));
    }

    if (action === "addProduct") {
      return jsonResponse(addProduct(data.product));
    }

    if (action === "updateProduct") {
      return jsonResponse(updateProduct(data.product));
    }

    if (action === "receiveStock") {
      return jsonResponse(receiveStock(data.codeabare, data.quantity));
    }

    if (action === "updateQuantity") {
      return jsonResponse(updateQuantity(data.codeabare));
    }

    if (action === "deleteProduct") {
      return jsonResponse(deleteProduct(data.codeabare));
    }

    if (action === "addResult") {
      return jsonResponse(addResult(data.result));
    }

    if (action === "receiveProduct") {
      return jsonResponse(receiveProduct(data.codeabare, data.finalPrice, data.to));
    }

    if (action === "getCodes") {
      return jsonResponse(getCodes());
    }

    if (action === "getSources") {
      return jsonResponse(getSources());
    }

    if (action === "getCategories") {
      return jsonResponse(getCategories());
    }

    if (action === "getResults") {
      return jsonResponse(getResults());
    }

    return jsonResponse({
      success: false,
      message: "Invalid action"
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message
    });
  }
}

// =====================================================
// JSON response helper
// =====================================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================
// Utility: Convert sheet rows to objects
// =====================================================
function sheetToObjects(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Sheet not found: " + sheetName);
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0];

  return values.slice(1)
    .filter(row => row.join("") !== "")
    .map(row => {
      const object = {};

      headers.forEach((header, index) => {
        object[header] = row[index];
      });

      return object;
    });
}

// =====================================================
// Utility: Get sheet headers
// =====================================================
function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

// =====================================================
// Utility: find product row by codeabare
// =====================================================
function findProductRowByCode(codeabare) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_PRODUIT);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const codeIndex = headers.indexOf("codeabare");

  if (codeIndex === -1) {
    throw new Error("codeabare column not found");
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][codeIndex]).trim() === String(codeabare).trim()) {
      return {
        sheet,
        values,
        headers,
        rowIndex: i + 1,
        rowValues: values[i]
      };
    }
  }

  return null;
}

// =====================================================
// Login code check
// =====================================================
function checkCode(code) {
  if (!code) {
    return {
      success: false,
      message: "Code is required"
    };
  }

  const codes = sheetToObjects(SHEET_CODES);

  const found = codes.find(item => {
    return String(item.Code).trim() === String(code).trim();
  });

  if (!found) {
    return {
      success: false,
      message: "Invalid code"
    };
  }

  return {
    success: true,
    user: {
      code: found.Code,
      name: found.name
    }
  };
}

// =====================================================
// Get all products
// =====================================================
function getProducts() {
  const products = sheetToObjects(SHEET_PRODUIT);

  return {
    success: true,
    products: products
  };
}

// =====================================================
// Get products by normal user
// =====================================================
function getProductsByUser(name) {
  const products = sheetToObjects(SHEET_PRODUIT);

  const filtered = products.filter(product => {
    return String(product.to).trim().toLowerCase() === String(name).trim().toLowerCase();
  });

  return {
    success: true,
    products: filtered
  };
}

// =====================================================
// Add product
// Includes new fields:
// category
// priceByWeight
// sellingPrice
// =====================================================
function addProduct(product) {
  if (!product) {
    return {
      success: false,
      message: "Product data is required"
    };
  }

  const sheet = getSpreadsheet().getSheetByName(SHEET_PRODUIT);
  const headers = getHeaders(sheet);

  const rowObject = {
    codeabare: product.codeabare,
    nameproduit: product.nameproduit,
    category: product.category,
    matiere: product.matiere,
    contiter: Number(product.contiter),
    price: Number(product.price),
    priceByWeight: Number(product.priceByWeight || 0),
    sellingPrice: Number(product.sellingPrice || 0),
    image: product.image,
    from: product.from,
    weidth: product.weidth,
    to: product.to
  };

  const row = headers.map(header => rowObject[header] !== undefined ? rowObject[header] : "");

  sheet.appendRow(row);

  return {
    success: true,
    message: "Product added"
  };
}

// =====================================================
// Edit product
// Updates all product data
// Uses oldCodeabare to find original row
// =====================================================
function updateProduct(product) {
  if (!product || !product.oldCodeabare) {
    return {
      success: false,
      message: "Product data or old codeabare is missing"
    };
  }

  const found = findProductRowByCode(product.oldCodeabare);

  if (!found) {
    return {
      success: false,
      message: "Product not found"
    };
  }

  const rowObject = {
    codeabare: product.codeabare,
    nameproduit: product.nameproduit,
    category: product.category,
    matiere: product.matiere,
    contiter: Number(product.contiter),
    price: Number(product.price),
    priceByWeight: Number(product.priceByWeight || 0),
    sellingPrice: Number(product.sellingPrice || 0),
    image: product.image,
    from: product.from,
    weidth: product.weidth,
    to: product.to
  };

  const newRow = found.headers.map(header => rowObject[header] !== undefined ? rowObject[header] : "");

  found.sheet
    .getRange(found.rowIndex, 1, 1, found.headers.length)
    .setValues([newRow]);

  return {
    success: true,
    message: "Product updated"
  };
}

// =====================================================
// Admin Receive Product
// Increases quantity for an existing product
// =====================================================
function receiveStock(codeabare, quantity) {
  const receivedQuantity = Number(quantity);

  if (!codeabare || receivedQuantity <= 0) {
    return {
      success: false,
      message: "Valid codeabare and quantity are required"
    };
  }

  const found = findProductRowByCode(codeabare);

  if (!found) {
    return {
      success: false,
      message: "Product not found"
    };
  }

  const quantityIndex = found.headers.indexOf("contiter");

  if (quantityIndex === -1) {
    return {
      success: false,
      message: "contiter column not found"
    };
  }

  const currentQuantity = Number(found.rowValues[quantityIndex] || 0);
  const newQuantity = currentQuantity + receivedQuantity;

  found.sheet
    .getRange(found.rowIndex, quantityIndex + 1)
    .setValue(newQuantity);

  return {
    success: true,
    message: "Stock received",
    newQuantity: newQuantity
  };
}

// =====================================================
// Decrease quantity by codeabare
// Kept for normal user receiving flow
// =====================================================
function updateQuantity(codeabare) {
  const found = findProductRowByCode(codeabare);

  if (!found) {
    return {
      success: false,
      message: "Product not found"
    };
  }

  const quantityIndex = found.headers.indexOf("contiter");

  if (quantityIndex === -1) {
    return {
      success: false,
      message: "contiter column not found"
    };
  }

  const currentQuantity = Number(found.rowValues[quantityIndex]);

  if (currentQuantity > 1) {
    found.sheet
      .getRange(found.rowIndex, quantityIndex + 1)
      .setValue(currentQuantity - 1);
  } else {
    found.sheet.deleteRow(found.rowIndex);
  }

  return {
    success: true,
    message: "Quantity updated"
  };
}

// =====================================================
// Delete product completely by codeabare
// Kept for compatibility
// =====================================================
function deleteProduct(codeabare) {
  const found = findProductRowByCode(codeabare);

  if (!found) {
    return {
      success: false,
      message: "Product not found"
    };
  }

  found.sheet.deleteRow(found.rowIndex);

  return {
    success: true,
    message: "Product deleted"
  };
}

// =====================================================
// Add result row
// =====================================================
function addResult(result) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_RESULT);

  sheet.appendRow([
    result.Date,
    result.Codeabare,
    result.nameproduit,
    Number(result.price),
    result.to
  ]);

  return {
    success: true,
    message: "Result added"
  };
}

// =====================================================
// Normal user Receive Product:
// 1. Find product assigned to user
// 2. Add transaction to Result
// 3. Decrease quantity or delete product
// =====================================================
function receiveProduct(codeabare, finalPrice, to) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_PRODUIT);
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      success: false,
      message: "No products found"
    };
  }

  const headers = values[0];

  const codeIndex = headers.indexOf("codeabare");
  const nameIndex = headers.indexOf("nameproduit");
  const quantityIndex = headers.indexOf("contiter");
  const toIndex = headers.indexOf("to");

  if (codeIndex === -1 || nameIndex === -1 || quantityIndex === -1 || toIndex === -1) {
    return {
      success: false,
      message: "Required product columns not found"
    };
  }

  for (let i = 1; i < values.length; i++) {
    const rowCode = String(values[i][codeIndex]).trim();
    const rowTo = String(values[i][toIndex]).trim();

    if (
      rowCode === String(codeabare).trim() &&
      rowTo.toLowerCase() === String(to).trim().toLowerCase()
    ) {
      const productName = values[i][nameIndex];
      const currentQuantity = Number(values[i][quantityIndex]);

      addResult({
        Date: formatToday(),
        Codeabare: codeabare,
        nameproduit: productName,
        price: finalPrice,
        to: to
      });

      if (currentQuantity > 1) {
        sheet.getRange(i + 1, quantityIndex + 1).setValue(currentQuantity - 1);
      } else {
        sheet.deleteRow(i + 1);
      }

      return {
        success: true,
        message: "Product received"
      };
    }
  }

  return {
    success: false,
    message: "Product not found for this user"
  };
}

// =====================================================
// Get codes/users
// =====================================================
function getCodes() {
  const codes = sheetToObjects(SHEET_CODES);

  return {
    success: true,
    codes: codes
  };
}

// =====================================================
// Get source values from Produit.from column
// =====================================================
function getSources() {
  const products = sheetToObjects(SHEET_PRODUIT);

  const sources = [...new Set(
    products
      .map(product => product.from)
      .filter(source => source !== "" && source !== null && source !== undefined)
      .map(source => String(source).trim())
  )];

  return {
    success: true,
    sources: sources
  };
}

// =====================================================
// Get category values from Produit.category column
// =====================================================
function getCategories() {
  const products = sheetToObjects(SHEET_PRODUIT);

  const categories = [...new Set(
    products
      .map(product => product.category)
      .filter(category => category !== "" && category !== null && category !== undefined)
      .map(category => String(category).trim())
  )];

  return {
    success: true,
    categories: categories
  };
}

// =====================================================
// Get result rows
// =====================================================
function getResults() {
  const results = sheetToObjects(SHEET_RESULT);

  return {
    success: true,
    results: results
  };
}

// =====================================================
// Format today's date as DD/MM/YYYY
// =====================================================
function formatToday() {
  const date = new Date();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}