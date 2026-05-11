import axios from 'axios';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL ?? '';

const api = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use();

api.interceptors.response.use();

export default api;
