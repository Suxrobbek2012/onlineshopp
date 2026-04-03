// API base URL — auto detect environment
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

// HTTP helper
const api = {
  async request(method, endpoint, data = null, isFormData = false) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && data) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (data) options.body = isFormData ? data : JSON.stringify(data);

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },
  get: (ep) => api.request('GET', ep),
  post: (ep, data) => api.request('POST', ep, data),
  put: (ep, data) => api.request('PUT', ep, data),
  delete: (ep) => api.request('DELETE', ep),
  postForm: (ep, formData) => api.request('POST', ep, formData, true),
  putForm: (ep, formData) => api.request('PUT', ep, formData, true),
};

window.api = api;
