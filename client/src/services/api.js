import axios from 'axios';

/**
 * Centralized Axios instance configuration.
 * Configuración centralizada de la instancia de Axios.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true, // Mandatory for cookies/sessions / Obligatorio para cookies/sesiones
});