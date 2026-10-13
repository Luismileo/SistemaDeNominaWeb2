import { createContext, useContext } from 'react';

/**
 * Authentication context object and consumer hook.
 * Objeto de contexto de autenticación y hook de consumo.
 *
 * Kept in a separate module from the provider (AuthContext.jsx) so that each
 * file exports a single kind of entity (component vs. hook/context), which
 * keeps Fast Refresh reliable and the codebase modular.
 * Se mantiene en un módulo separado del provider (AuthContext.jsx) para que cada
 * archivo exporte un solo tipo de entidad (componente vs. hook/contexto),
 * favoreciendo la modularidad y el Fast Refresh.
 */
export const AuthContext = createContext(null);

/**
 * Custom hook to consume AuthContext / Hook personalizado para consumir el contexto.
 */
export const useAuth = () => useContext(AuthContext);
