// api.js
// One place that knows how to talk to the backend, so components don't
// each have to remember the base URL or re-attach the auth token.

const BASE_URL = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

/**
 * Wraps fetch() to automatically:
 * - prepend the backend's base URL
 * - attach "Authorization: Bearer <token>" if we have one
 * - parse the JSON response
 * - throw a real Error (with the backend's message) on failure, so
 *   callers can use normal try/catch
 */
async function request(path, options = {}) {
  const token = getToken();

  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Don't set Content-Type for file uploads -- the browser needs to set
  // its own multipart boundary when sending FormData.
  const isFormData = options.body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

export const api = {
  signup: (name, email, password) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  getDocuments: () => request("/documents"),

  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/documents/upload", { method: "POST", body: formData });
  },

  deleteDocument: (id) => request(`/documents/${id}`, { method: "DELETE" }),

  getConversations: () => request("/conversations"),

  createConversation: () => request("/conversations", { method: "POST" }),

  getMessages: (conversationId) => request(`/conversations/${conversationId}/messages`),

  ask: (question, conversationId) =>
    request("/ask", { method: "POST", body: JSON.stringify({ question, conversationId }) }),
};

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isLoggedIn() {
  return Boolean(getToken());
}
