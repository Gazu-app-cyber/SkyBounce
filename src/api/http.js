import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_SKYBOUNCE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
