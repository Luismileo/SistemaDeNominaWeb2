import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parseYaml } from 'js-yaml';
import { pool } from '../config/db.js';

const currentFileUrl = import.meta.url;
const currentDirectory = path.dirname(fileURLToPath(currentFileUrl));

// Carpeta que centraliza los archivos YAML con las sentencias SQL del servidor
const QUERIES_DIRECTORY = path.resolve(currentDirectory, '..', '..', 'queries');

/**
 * Cargador de sentencias SQL externalizadas en archivos YAML.
 * Lee todos los archivos .yaml/.yml de la carpeta `queries/`, los registra en
 * memoria y los ejecuta contra el pool de PostgreSQL sin usar SQL dentro de los
 * archivos JavaScript.
 */
export class QueryLoader {
  #queries = new Map();

  /**
   * @param {string} directory Ruta de la carpeta que contiene los YAML de consultas
   */
  constructor(directory = QUERIES_DIRECTORY) {
    this.#loadQueriesFromDirectory(directory);
  }

  // Recorre la carpeta y registra cada sentencia declarada en los YAML
  #loadQueriesFromDirectory(directory) {
    const files = readdirSync(directory).filter((file) => /\.ya?ml$/i.test(file));

    for (const file of files) {
      const filePath = path.join(directory, file);
      const document = parseYaml(readFileSync(filePath, 'utf8')) ?? {};

      for (const [queryName, statement] of Object.entries(document)) {
        if (typeof statement === 'string' && statement.trim().length > 0) {
          this.#queries.set(queryName, statement.trim());
        }
      }
    }
  }

  /**
   * Devuelve la sentencia SQL registrada con el nombre indicado.
   * Lanza un error si la consulta no existe (evita fallos silenciosos).
   */
  getQuery(queryName) {
    const statement = this.#queries.get(queryName);

    if (!statement) {
      throw new Error(`SQL query "${queryName}" was not found in the YAML queries folder`);
    }

    return statement;
  }

  /**
   * Ejecuta una sentencia parametrizada y devuelve todas las filas resultantes.
   */
  async execute(queryName, params = []) {
    const { rows } = await pool.query(this.getQuery(queryName), params);
    return rows;
  }

  /**
   * Ejecuta una sentencia y devuelve solo la primera fila (o null si no hay filas).
   */
  async executeOne(queryName, params = []) {
    const rows = await this.execute(queryName, params);
    return rows?.[0] ?? null;
  }

  // Cantidad de consultas cargadas (útil para verificar la carga al arrancar)
  get size() {
    return this.#queries.size;
  }
}

// Instancia única reutilizada por todo el servidor
export const queryLoader = new QueryLoader();
