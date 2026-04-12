// API base URL — barcha holatlar uchun
function getApiBase() {
  const h = window.location.hostname;
  const proto = window.location.protocol;
  if (proto === 'file:' || h === '' || h === 'localhost' || h === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return '/api';
}

const API_BASE = getApiBase();
const IMG_SERVER = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : '';

const api = {
  async request(method, endpoint, data = null, isFormData = false) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && data) headers['Content-Type'] = 'application/json';
    const options = { method, headers, mode: 'cors' };
    if (data) options.body = isFormData ? data : JSON.stringify(data);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Xato: ${res.status}`);
      return json;
    } catch (err) {
      if (err.name === 'TypeError') {
        throw new Error('Backend server ishlamayapti! Terminalda: cd backend && node server.js');
      }
      throw err;
    }
  },
  get:      (ep)     => api.request('GET',    ep),
  post:     (ep, d)  => api.request('POST',   ep, d),
  put:      (ep, d)  => api.request('PUT',    ep, d),
  delete:   (ep)     => api.request('DELETE', ep),
  postForm: (ep, fd) => api.request('POST',   ep, fd, true),
  putForm:  (ep, fd) => api.request('PUT',    ep, fd, true),
};

window.api = api;
window.API_BASE = API_BASE;
window.IMG_SERVER = IMG_SERVER;
