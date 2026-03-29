/**
 * Proxy-based chainable mock for Drizzle ORM database.
 *
 * Supports:
 * - Chainable: db.select().from().where().limit().offset().orderBy()
 * - Insert/update/delete: db.insert().values().returning(), etc.
 * - Relational: db.query.tableName.findFirst(), db.query.tableName.findMany()
 * - Transactions: db.transaction(async (tx) => { ... })
 * - Inspection: db._calls, db._results, db._reset()
 * - Queued results: db._resultsQueue for operations that need different results per call
 * - Table-aware keys: from()/insert()/update()/delete() capture the table name
 *   so results can be set as e.g. 'select.member' or 'insert.proposals'.
 *   Falls back to generic key ('select') when no table-specific result is found.
 *
 * Valid result key patterns:
 *   - 'select', 'insert', 'update', 'delete'                (generic)
 *   - 'select.<table>', 'insert.<table>', etc.               (table-specific)
 *   - 'tx.select', 'tx.insert', 'tx.update', 'tx.delete'    (transaction generic)
 *   - 'tx.select.<table>', 'tx.insert.<table>', etc.         (transaction table-specific)
 *   - 'query.<table>.findFirst', 'query.<table>.findMany'    (relational)
 *   - 'default'                                              (ultimate fallback)
 */

type CallRecord = { method: string; args: unknown[] };

/** Extract table name from a Drizzle table object (Symbol-based or _.name) */
function extractTableName(tableRef: unknown): string | null {
  if (tableRef == null || typeof tableRef !== 'object') return null;

  // Drizzle stores the SQL table name in a Symbol
  const drizzleName = Symbol.for('drizzle:Name');
  if (drizzleName in (tableRef as any)) {
    return (tableRef as any)[drizzleName] as string;
  }

  // Fallback: Drizzle also exposes _.name on table objects
  if ('_' in (tableRef as any) && typeof (tableRef as any)._.name === 'string') {
    return (tableRef as any)._.name as string;
  }

  return null;
}

export function createMockDb() {
  const calls: CallRecord[] = [];
  const results = new Map<string, unknown>();
  const resultsQueue = new Map<string, unknown[]>();

  function reset() {
    calls.length = 0;
    results.clear();
    resultsQueue.clear();
  }

  /** Resolve a result, checking queue first, then table-specific key, then generic key, then 'default'. */
  function getResult(rootOp: string, tableName: string | null): unknown {
    // Build lookup order: table-specific first, then generic
    const keys = tableName
      ? [`${rootOp}.${tableName}`, rootOp]
      : [rootOp];

    for (const key of keys) {
      const queue = resultsQueue.get(key);
      if (queue && queue.length > 0) {
        return queue.shift();
      }
      if (results.has(key)) return results.get(key);
    }
    return results.get('default') ?? [];
  }

  function getResultForQuery(key: string): unknown {
    const queue = resultsQueue.get(key);
    if (queue && queue.length > 0) {
      return queue.shift();
    }
    if (results.has(key)) return results.get(key);
    return results.get('default');
  }

  function createChain(rootOp: string, initialTable?: string | null): any {
    let tableName: string | null = initialTable ?? null;
    const chain: any = {};

    // Methods that receive a table reference as first arg
    const tableCaptureMethods = ['from', 'insert', 'update', 'delete'];

    const chainMethods = [
      'select', 'from', 'where', 'limit', 'offset', 'orderBy',
      'insert', 'values', 'returning', 'onConflictDoUpdate', 'onConflictDoNothing',
      'update', 'set',
      'delete',
      'innerJoin', 'leftJoin', 'rightJoin', 'fullJoin',
      'groupBy', 'having',
    ];

    for (const method of chainMethods) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ method: `${rootOp}.${method}`, args });
        if (tableCaptureMethods.includes(method) && args[0]) {
          tableName = extractTableName(args[0]) ?? tableName;
        }
        return chainProxy;
      };
    }

    // .then() makes the chain awaitable — resolves with configured result
    // If the result is an Error instance, reject instead of resolving.
    chain.then = (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) => {
      const result = getResult(rootOp, tableName);
      if (result instanceof Error) {
        if (reject) reject(result);
      } else {
        try {
          resolve(result);
        } catch (e) {
          if (reject) reject(e);
        }
      }
    };

    const chainProxy = new Proxy(chain, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string') {
          return (...args: unknown[]) => {
            calls.push({ method: `${rootOp}.${prop}`, args });
            return chainProxy;
          };
        }
        return undefined;
      },
    });

    return chainProxy;
  }

  function createQueryProxy(): any {
    return new Proxy({}, {
      get(_, tableName) {
        if (typeof tableName !== 'string') return undefined;
        return {
          findFirst: (...args: unknown[]) => {
            const key = `query.${tableName}.findFirst`;
            calls.push({ method: key, args });
            const val = getResultForQuery(key);
            if (val instanceof Error) return Promise.reject(val);
            return Promise.resolve(val === undefined ? undefined : val);
          },
          findMany: (...args: unknown[]) => {
            const key = `query.${tableName}.findMany`;
            calls.push({ method: key, args });
            const val = getResultForQuery(key);
            if (val instanceof Error) return Promise.reject(val);
            return Promise.resolve(val ?? []);
          },
        };
      },
    });
  }

  const db = {
    _calls: calls,
    _results: results,
    _resultsQueue: resultsQueue,
    _reset: reset,

    query: createQueryProxy(),

    select: (...args: unknown[]) => {
      calls.push({ method: 'select', args });
      return createChain('select');
    },

    insert: (...args: unknown[]) => {
      calls.push({ method: 'insert', args });
      return createChain('insert', extractTableName(args[0]));
    },

    update: (...args: unknown[]) => {
      calls.push({ method: 'update', args });
      return createChain('update', extractTableName(args[0]));
    },

    delete: (...args: unknown[]) => {
      calls.push({ method: 'delete', args });
      return createChain('delete', extractTableName(args[0]));
    },

    transaction: async (fn: (tx: any) => Promise<unknown>) => {
      calls.push({ method: 'transaction', args: [fn] });
      const txProxy = createTxProxy();
      return fn(txProxy);
    },
  };

  function createTxProxy(): any {
    const txMethods = ['select', 'insert', 'update', 'delete'];
    const tx: any = {};
    for (const method of txMethods) {
      tx[method] = (...args: unknown[]) => {
        calls.push({ method: `tx.${method}`, args });
        return createChain(`tx.${method}`, extractTableName(args[0]));
      };
    }
    tx.query = createQueryProxy();
    return tx;
  }

  return db;
}

export type MockDb = ReturnType<typeof createMockDb>;
