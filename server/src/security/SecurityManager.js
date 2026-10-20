import { queryLoader } from './QueryLoader.js';

/**
 * Administrador de seguridad en memoria.
 * Mantiene el mapa de permisos de métodos y opciones cuyas llaves siguen el
 * formato: subsystem_id + "_" + class_id + "_" + method_id + "_" + profile_id
 * y cuyo valor es booleano (true / false).
 */
export class SecurityManager {
  // Mapa de permisos de métodos en memoria: llave compuesta -> booleano
  permissionMethodMap = new Map();

  // Mapa de permisos de opciones en memoria: llave compuesta -> booleano
  permissionOptionMap = new Map();

  // Usuarios cuyos permisos ya fueron cargados en esta instancia
  #loadedUsers = new Set();

  // Catálogos usados para convertir nombres del payload en IDs de tabla
  #subsystemCatalog = new Map();
  #classCatalog = new Map();
  #methodCatalog = new Map();
  #optionCatalog = new Map();
  #catalogsLoaded = false;

  // Carga los catálogos (subsystem, class, method, option) desde la base de datos
  async loadCatalogs() {
    const [subsystems, classes, methods, options] = await Promise.all([
      queryLoader.execute('getSubsystems'),
      queryLoader.execute('getClasses'),
      queryLoader.execute('getMethods'),
      queryLoader.execute('getOptions'),
    ]);

    this.#subsystemCatalog = new Map(
      subsystems.map((row) => [row.subsystem_name.toLowerCase(), Number(row.subsystem_id)]),
    );
    this.#classCatalog = new Map(
      classes.map((row) => [row.class_name.toLowerCase(), Number(row.class_id)]),
    );
    this.#optionCatalog = new Map(
      options.map((row) => [row.option_name.toLowerCase(), Number(row.option_id)]),
    );

    // Los métodos se registran por nombre y también por "classId:nombre" para
    // evitar colisiones cuando dos clases comparten el mismo nombre de método
    this.#methodCatalog = new Map();
    for (const row of methods) {
      const normalizedName = row.method_name.toLowerCase();
      this.#methodCatalog.set(normalizedName, Number(row.method_id));
      this.#methodCatalog.set(`${Number(row.class_id)}:${normalizedName}`, Number(row.method_id));
    }

    this.#catalogsLoaded = true;
    return this;
  }

  // Indica si los catálogos ya fueron cargados (se cargan de forma perezosa)
  get areCatalogsLoaded() {
    return this.#catalogsLoaded;
  }

  // Carga en el mapa de permisos todos los permisos asociados a los perfiles del usuario
  async loadPermissions(userId) {
    if (!this.#catalogsLoaded) {
      await this.loadCatalogs();
    }

    const [methodPermissions, optionPermissions] = await Promise.all([
      queryLoader.execute('loadUserPermissions', [userId]),
      queryLoader.execute('loadUserOptionPermissions', [userId]),
    ]);

    for (const row of methodPermissions) {
      const key = this.buildKey(
        row.subsystem_id,
        row.class_id,
        row.method_id,
        row.profile_id,
      );
      this.permissionMethodMap.set(key, row.is_allowed === true);
    }

    for (const row of optionPermissions) {
      const key = this.buildKey(row.subsystem_id, row.option_id, null, row.profile_id);
      this.permissionOptionMap.set(key, row.is_allowed === true);
    }

    this.#loadedUsers.add(Number(userId));
    return this;
  }

  // Verifica si los permisos del usuario ya están en memoria
  hasPermissions(userId) {
    return this.#loadedUsers.has(Number(userId));
  }

  /**
   * Construye la llave estándar de permiso de métodos.
   * Formato: subsystem_id_class_id_method_id_profile_id
   */
  buildKey(subsystemId, classId, methodId, profileId) {
    return `${subsystemId}_${classId}_${methodId}_${profileId}`;
  }

  // Consulta puntual de un permiso de método en el mapa en memoria
  getPermissionMethod(key) {
    return this.permissionMethodMap.get(key) ?? false;
  }

  // Consulta puntual de un permiso de opción en el mapa en memoria
  getPermissionOption(key) {
    return this.permissionOptionMap.get(key) ?? false;
  }

  /**
   * Construye la llave de permiso a partir del payload entrante del despachador.
   * Acepta tanto IDs numéricos como nombres de subsystem/class/method.
   */
  buildKeyFromRequest({ subsystem, class: className, method }, profileId) {
    const subsystemId = this.#resolveSubsystemId(subsystem);
    const classId = this.#resolveClassId(className);
    const methodId = this.#resolveMethodId(method, classId);

    if (subsystemId === null || classId === null || methodId === null) {
      return null;
    }

    return this.buildKey(subsystemId, classId, methodId, profileId);
  }

  /**
   * Evalúa si al menos uno de los perfiles del usuario tiene permiso para el
   * método solicitado en el payload.
   */
  hasMethodPermission(profileIds = [], request) {
    return (profileIds ?? []).some((profileId) => {
      const key = this.buildKeyFromRequest(request, profileId);
      return key !== null && this.getPermissionMethod(key);
    });
  }

  // Evalúa el permiso de una opción para los perfiles dados
  hasOptionPermission(profileIds = [], { subsystem, option }) {
    const subsystemId = this.#resolveSubsystemId(subsystem);
    const optionId = this.#resolveOptionId(option);

    if (subsystemId === null || optionId === null) {
      return false;
    }

    return (profileIds ?? []).some((profileId) =>
      this.getPermissionOption(this.buildKey(subsystemId, optionId, null, profileId)),
    );
  }

  // Reinicia los mapas (útil para pruebas o recargas manuales)
  reset() {
    this.permissionMethodMap.clear();
    this.permissionOptionMap.clear();
    this.#loadedUsers.clear();
  }

  // Normaliza un valor que puede venir como ID numérico o como nombre
  #toIdOrName(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = String(value).trim();
    if (normalized === '') {
      return null;
    }

    const numericValue = Number(normalized);

    // Si el valor es un ID numérico entero se usa directamente
    if (Number.isInteger(numericValue)) {
      return { id: numericValue };
    }

    return { name: normalized.toLowerCase() };
  }

  #resolveSubsystemId(subsystem) {
    const parsed = this.#toIdOrName(subsystem);
    if (!parsed) return null;
    return parsed.id ?? this.#subsystemCatalog.get(parsed.name) ?? null;
  }

  #resolveClassId(className) {
    const parsed = this.#toIdOrName(className);
    if (!parsed) return null;
    if (parsed.id !== undefined) return parsed.id;

    return this.#classCatalog.get(parsed.name) ?? null;
  }

  #resolveMethodId(methodName, classId) {
    const parsed = this.#toIdOrName(methodName);
    if (!parsed) return null;
    if (parsed.id !== undefined) return parsed.id;

    // Primero se intenta resolver el método dentro de la clase detectada
    const scopedKey = `${classId}:${parsed.name}`;
    const scopedId = this.#methodCatalog.get(scopedKey);
    if (scopedId !== undefined) return scopedId;

    return this.#methodCatalog.get(parsed.name) ?? null;
  }

  #resolveOptionId(optionName) {
    const parsed = this.#toIdOrName(optionName);
    if (!parsed) return null;
    return parsed.id ?? this.#optionCatalog.get(parsed.name) ?? null;
  }
}

// Instancia única del administrador de seguridad (mapa en memoria compartido)
export const securityManager = new SecurityManager();
