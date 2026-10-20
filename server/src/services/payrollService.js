import { queryLoader } from '../security/QueryLoader.js';

/**
 * Error de proceso utilizado por el despachador dinámico para devolver un
 * código HTTP adecuado cuando la clase o el método solicitados no existen.
 */
export class ProcessError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ProcessError';
    this.statusCode = statusCode;
  }
}

/**
 * Clase de negocio del subsistema de nómina (subsystem: payroll).
 * Cada método público de esta clase es invocable de forma dinámica desde el
 * endpoint /api/toProcess una vez validado el permiso del perfil.
 */
export class EmployeeController {
  /**
   * Construye el resumen de nómina: indicadores generales y detalle de
   * empleados con sus perfiles asignados.
   * @param {object} params Parámetros enviados por el cliente en el payload
   */
  async getPayrollSummary(params = {}) {
    const [stats] = await queryLoader.execute('getPayrollSummaryStats');
    const employees = await queryLoader.execute('getEmployeesWithProfiles');

    const includeDetails = params?.includeDetails ?? true;

    return {
      generatedAt: new Date().toISOString(),
      period: params?.period ?? null,
      stats: {
        employeeCount: Number(stats?.employee_count ?? 0),
        userCount: Number(stats?.user_count ?? 0),
        profileCount: Number(stats?.profile_count ?? 0),
        subsystemCount: Number(stats?.subsystem_count ?? 0),
        methodPermissionCount: Number(stats?.method_permission_count ?? 0),
      },
      employees: includeDetails
        ? employees.map((employee) => ({
            personId: employee.person_id,
            firstName: employee.first_name,
            lastName: employee.last_name,
            userId: employee.user_id,
            username: employee.username,
            profiles: employee.profiles,
          }))
        : [],
    };
  }
}

// Registro de clases disponibles para el despacho dinámico (className -> clase)
const processRegistry = new Map([[EmployeeController.name, EmployeeController]]);

// Verifica que el método esté declarado en la clase y no heredado de Object.prototype
const isDeclaredInClass = (instance, methodName) => {
  let currentPrototype = Object.getPrototypeOf(instance);

  while (currentPrototype && currentPrototype !== Object.prototype) {
    if (Object.hasOwn(currentPrototype, methodName)) {
      return true;
    }
    currentPrototype = Object.getPrototypeOf(currentPrototype);
  }

  return false;
};

/**
 * Invoca dinámicamente la clase y el método solicitados en el payload.
 * @param {string} className Nombre de la clase registrada (ej: EmployeeController)
 * @param {string} methodName Nombre del método a ejecutar (ej: getPayrollSummary)
 * @param {object} params Parámetros libres del proceso
 * @returns {Promise<any>} Resultado devuelto por el método invocado
 */
export async function invokeProcess(className, methodName, params = {}) {
  const normalizedClassName = String(className ?? '').trim();
  const normalizedMethodName = String(methodName ?? '').trim();

  const ProcessClass = processRegistry.get(normalizedClassName);
  if (!ProcessClass) {
    throw new ProcessError(`Class "${normalizedClassName}" is not registered in the process registry`, 404);
  }

  // Se valida que el nombre del método sea un identificador válido
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(normalizedMethodName)) {
    throw new ProcessError(`Invalid method name "${normalizedMethodName}"`, 400);
  }

  const instance = new ProcessClass();
  const handler = instance[normalizedMethodName];

  if (typeof handler !== 'function' || normalizedMethodName === 'constructor' || !isDeclaredInClass(instance, normalizedMethodName)) {
    throw new ProcessError(`Method "${normalizedMethodName}" does not exist in class "${normalizedClassName}"`, 404);
  }

  return await handler.call(instance, params);
}

// Listado de procesos disponibles (útil para documentar el despachador)
export const availableProcesses = () => [...processRegistry.keys()];
