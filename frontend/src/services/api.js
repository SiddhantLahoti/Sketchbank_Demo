// frontend/src/services/api.js

const HOST = typeof window !== "undefined" ? window.location.hostname : "localhost";
export const API_BASE_URL = `http://${HOST}:8000`;

/**
 * Converts a relative backend storage path (e.g. "/storage/cropped_products/x.png")
 * into a full network-accessible URL.
 */
export function getImageUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `${API_BASE_URL}${relativePath}`;
}

/**
 * Builds clean URL query parameters while preserving boolean false and 0.
 */
function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Core fetch wrapper for JSON and FormData requests.
 */
async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // --- 1. AUTHENTICATION ---
  login(username, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // --- 2. INGESTION & CROPPING (Tab 1) ---
  uploadSketchFile(file, userId) {
    const formData = new FormData();
    formData.append("file", file);
    const query = buildQuery({ user_id: userId });

    return request(`/api/ingestion/upload${query}`, {
      method: "POST",
      body: formData,
    });
  },

  confirmCrops(payload) {
    // payload: { file_id, page_number, page_image_path, boxes, user_id }
    return request("/api/ingestion/confirm-crops", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // --- 3. METADATA & PENDING QUEUE ---
  getMasterDropdowns() {
    return request("/api/metadata/dropdowns/master");
  },

  getPendingProducts() {
    return request("/api/metadata/pending-products");
  },

  submitMetadata(payload) {
    return request("/api/metadata/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateProductMetadata(metadataId, payload) {
    return request(`/api/metadata/products/${metadataId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  getNextSerial() {
    return request("/api/metadata/next-serial");
  },


  // --- 4. TEXTUAL & CATALOG SEARCH ---
  searchProducts(filters = {}) {
    // filters: { q, main_category, category, metal_type, diamond_type, creative_designer, customer_name, market, is_exclusive, page, limit }
    const query = buildQuery(filters);
    return request(`/api/search/products${query}`);
  },

  // --- 5. VISUAL SIMILARITY SEARCH ---
  searchSimilarByFile(file, { min_similarity = 0.65, main_category = "", limit = 24 } = {}) {
    const formData = new FormData();
    formData.append("file", file);
    const query = buildQuery({ min_similarity, main_category, limit });

    return request(`/api/similarity/search-by-file${query}`, {
      method: "POST",
      body: formData,
    });
  },

  findSimilarByProduct(croppedProductId, limit = 10) {
    const query = buildQuery({ limit });
    return request(`/api/similarity/by-product/${croppedProductId}${query}`);
  },

  backfillEmbeddings() {
    return request("/api/similarity/backfill", {
      method: "POST",
    });
  },
  
  searchSimilarByText(q, { min_similarity = 0.12, main_category = "", limit = 24 } = {}) {
    const query = buildQuery({ q, min_similarity, main_category, limit });
    return request(`/api/similarity/search-by-text${query}`);
  },


  // --- 6. PRODUCTIVITY REPORTS ---
  getProductivityReport(params = {}) {
    // params: { time_range, start_date, end_date }
    const query = buildQuery(params);
    return request(`/api/reports/productivity${query}`);
  },

  // --- 7. AUDIT LOGS ---
  getAuditLogs(params = {}) {
    // params: { q, action, username, start_date, end_date, page, limit }
    const query = buildQuery(params);
    return request(`/api/logs${query}`);
  },

  // --- 8. MASTER DATA MANAGEMENT ---
  getMasterItems(entity) {
    return request(`/api/masters/${entity}`);
  },

  createMasterItem(entity, payload) {
    return request(`/api/masters/${entity}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateMasterItem(entity, id, payload) {
    return request(`/api/masters/${entity}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteMasterItem(entity, id) {
    return request(`/api/masters/${entity}/${id}`, {
      method: "DELETE",
    });
  },

  
};