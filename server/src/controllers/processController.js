import { securityManager } from '../security/SecurityManager.js';
import { invokeProcess, ProcessError } from '../services/payrollService.js';

/**
 * Despachador dinámico centralizado (POST /api/toProcess).
 * Ejecuta el pipeline de seguridad de tres pasos:
 *   a) Tiene Sesión
 *   b) Tiene Permiso
 *   c) Ejecuto el Método
 */
export const dispatchToProcess = async (req, res) => {
  // ---------------------------------------------------------------
  // PASO 1: Tiene Sesión -> debe existir req.session.userId
  // ---------------------------------------------------------------
  if (!req.session?.userId) {
    return res.status(401).json({
      ok: false,
      step: 'session',
      error: 'An active session is required to execute a process',
    });
  }

  const {
    subsystem,
    class: classNameFromBody,
    className: classNameAlias,
    method: methodNameFromBody,
    methodName: methodNameAlias,
    params = {},
  } = req.body ?? {};

  const className = classNameFromBody ?? classNameAlias;
  const methodName = methodNameFromBody ?? methodNameAlias;

  if (!subsystem || !className || !methodName) {
    return res.status(400).json({
      ok: false,
      step: 'payload',
      error: 'The payload must include subsystem, class and method',
    });
  }

  const request = { subsystem, class: className, method: methodName };
  const profileIds = req.session?.profileIds ?? [];

  try {
    // Se cargan los permisos del usuario en memoria si aún no están disponibles
    if (!securityManager.hasPermissions(req.session.userId)) {
      await securityManager.loadPermissions(req.session.userId);
    }

    // ---------------------------------------------------------------
    // PASO 2: Tiene Permiso -> llave subsystem_class_method_profile
    // ---------------------------------------------------------------
    const permissionKeys = profileIds.map((profileId) =>
      securityManager.buildKeyFromRequest(request, profileId),
    );

    // Si la llave no puede armarse, el proceso solicitado no existe en los catálogos
    if (permissionKeys.length > 0 && permissionKeys.every((key) => key === null)) {
      return res.status(404).json({
        ok: false,
        step: 'permission',
        error: 'The requested subsystem, class or method does not exist',
      });
    }

    const hasPermission = permissionKeys.some(
      (key) => key !== null && securityManager.getPermissionMethod(key),
    );

    if (!hasPermission) {
      return res.status(403).json({
        ok: false,
        step: 'permission',
        error: 'The current profile is not allowed to execute this method',
      });
    }

    // ---------------------------------------------------------------
    // PASO 3: Ejecuto el Método -> invocación dinámica de la clase/método
    // ---------------------------------------------------------------
    const data = await invokeProcess(className, methodName, params);

    return res.status(200).json({
      ok: true,
      step: 'executed',
      process: { subsystem, class: className, method: methodName },
      data,
    });
  } catch (error) {
    const statusCode = error instanceof ProcessError ? error.statusCode : 500;

    if (!(error instanceof ProcessError)) {
      console.error('Process dispatch error:', error);
    }

    return res.status(statusCode).json({
      ok: false,
      step: 'execution',
      error: error?.message ?? 'Unexpected error while executing the process',
    });
  }
};
