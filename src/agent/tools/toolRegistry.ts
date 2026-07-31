import Database from 'better-sqlite3';

/**
 * CAPA 6: REGISTRO INDEPENDIENTE DE HERRAMIENTAS (Tool Registry)
 * 
 * Permite registrar y exponer herramientas dinámicas e independientes para que
 * el cerebro del agente (DeepSeek) pueda ejecutarlas mediante Tool Calling.
 */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolExecutor {
  definition: ToolDefinition;
  execute: (userId: string, args: any, db: Database.Database) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolExecutor> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool(tool: ToolExecutor) {
    this.tools.set(tool.definition.function.name, tool);
  }

  public getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  public async executeTool(name: string, userId: string, args: any, db: Database.Database): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Herramienta no registrada: ${name}`);
    }
    return await tool.execute(userId, args, db);
  }

  /**
   * Registra el catálogo inicial de herramientas financieras independientes
   */
  private registerDefaultTools() {
    // 1. Herramienta de Resumen Financiero (Budget & Summary Tool)
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'get_financial_summary',
          description: 'Obtiene el patrimonio neto, ingresos, gastos y saldos por cuenta del usuario',
          parameters: {
            type: 'object',
            properties: {},
          }
        }
      },
      execute: async (userId, args, db) => {
        const txs = db.prepare('SELECT type, amount FROM transactions WHERE userId = ?').all(userId) as any[];
        const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const totalBalance = totalIncome - totalExpense;

        const accounts = db.prepare('SELECT id, name, balance, type FROM accounts WHERE userId = ?').all(userId);
        return {
          totalBalance,
          totalIncome,
          totalExpense,
          accounts
        };
      }
    });

    // 2. Herramienta de Filtrado de Movimientos (Transactions Tool)
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'get_user_transactions',
          description: 'Obtiene el listado de movimientos o transacciones recientes del usuario',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Cantidad máxima de movimientos a recuperar (ej. 10)' },
              category: { type: 'string', description: 'Categoría opcional para filtrar' }
            }
          }
        }
      },
      execute: async (userId, args, db) => {
        const limit = args.limit || 15;
        let query = 'SELECT id, type, amount, category, description, date FROM transactions WHERE userId = ?';
        const params: any[] = [userId];

        if (args.category) {
          query += ' AND category LIKE ?';
          params.push(`%${args.category}%`);
        }

        query += ' ORDER BY date DESC LIMIT ?';
        params.push(limit);

        return db.prepare(query).all(...params);
      }
    });

    // 3. Herramienta de Simulación de Proyección & Interés Compuesto (Forecast Tool)
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'simulate_investment_forecast',
          description: 'Calcula la proyección de crecimiento de una inversión a futuro con interés compuesto',
          parameters: {
            type: 'object',
            properties: {
              initialAmount: { type: 'number', description: 'Monto inicial a invertir' },
              monthlyContribution: { type: 'number', description: 'Aporte mensual' },
              annualReturnPercentage: { type: 'number', description: 'Tasa de retorno anual estimada (ej. 7.5)' },
              years: { type: 'number', description: 'Años de proyección (ej. 5)' }
            },
            required: ['initialAmount', 'monthlyContribution', 'annualReturnPercentage', 'years']
          }
        }
      },
      execute: async (userId, args) => {
        const { initialAmount, monthlyContribution, annualReturnPercentage, years } = args;
        const monthlyRate = annualReturnPercentage / 100 / 12;
        const totalMonths = years * 12;

        let currentBalance = initialAmount;
        let totalInvested = initialAmount;

        for (let m = 1; m <= totalMonths; m++) {
          currentBalance = (currentBalance + monthlyContribution) * (1 + monthlyRate);
          totalInvested += monthlyContribution;
        }

        const totalEarnedInterest = currentBalance - totalInvested;

        return {
          years,
          totalInvested: Math.round(totalInvested * 100) / 100,
          finalBalance: Math.round(currentBalance * 100) / 100,
          earnedInterest: Math.round(totalEarnedInterest * 100) / 100
        };
      }
    });

    // 4. Herramienta de Registro de Movimiento (Transaction Creator Tool)
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'create_transaction',
          description: 'Registra una nueva transacción (gasto o ingreso) en la base de datos del usuario',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['income', 'expense'] },
              amount: { type: 'number' },
              category: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['type', 'amount', 'category']
          }
        }
      },
      execute: async (userId, args, db) => {
        const id = 'tx-' + Math.random().toString(36).substring(2, 9);
        const date = new Date().toISOString().split('T')[0];
        const { type, amount, category, description } = args;

        // Mismo contrato que POST /api/finance/transactions: la tabla exige
        // accountId y el saldo de la cuenta debe reflejar el movimiento.
        const account = db.prepare('SELECT id, name FROM accounts WHERE userId = ? LIMIT 1').get(userId) as any;
        if (!account) {
          return { success: false, error: 'El usuario no tiene ninguna cuenta creada. Pídele que cree primero una cuenta (efectivo, banco o tarjeta) para poder registrar el movimiento.' };
        }

        db.prepare(`
          INSERT INTO transactions (id, userId, accountId, type, amount, category, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, userId, account.id, type, amount, category || 'General', description || '', date);

        const delta = type === 'income' ? Number(amount) : -Number(amount);
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?').run(delta, account.id, userId);

        return { success: true, transactionId: id, amount, type, category, account: account.name };
      }
    });

    // 4b. Préstamos y deudas: tanto lo que el usuario debe como lo que le deben.
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'create_debt',
          description: 'Registra un préstamo o deuda. type="debt" si el usuario DEBE dinero a alguien; type="receivable" si ALGUIEN LE DEBE dinero al usuario (préstamo que él hizo, cobro pendiente).',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['debt', 'receivable'] },
              personOrEntity: { type: 'string', description: 'Persona o entidad de la deuda/préstamo (ej. "Carlos", "Banco X")' },
              name: { type: 'string', description: 'Concepto corto (ej. "Préstamo para el móvil")' },
              amount: { type: 'number' },
              dueDate: { type: 'string', description: 'Fecha límite YYYY-MM-DD (opcional)' }
            },
            required: ['type', 'personOrEntity', 'amount']
          }
        }
      },
      execute: async (userId, args, db) => {
        const id = 'debt-' + Math.random().toString(36).substring(2, 9);
        const { type, personOrEntity, name, amount, dueDate } = args;
        db.prepare(`
          INSERT INTO debts (id, userId, name, personOrEntity, type, amount, paidAmount, dueDate, status)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'pending')
        `).run(id, userId, name || (type === 'receivable' ? `Préstamo a ${personOrEntity}` : `Deuda con ${personOrEntity}`), personOrEntity, type, amount, dueDate || '');
        return { success: true, debtId: id, type, personOrEntity, amount };
      }
    });

    // 4c. Listado de deudas/préstamos del usuario.
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'get_user_debts',
          description: 'Lista las deudas y préstamos del usuario (lo que debe y lo que le deben), con sus ids',
          parameters: { type: 'object', properties: {} }
        }
      },
      execute: async (userId, args, db) => {
        return db.prepare('SELECT id, name, personOrEntity, type, amount, paidAmount, dueDate, status FROM debts WHERE userId = ? ORDER BY dueDate ASC').all(userId);
      }
    });

    // 4d. Borrado de movimientos con CONFIRMACIÓN del usuario: la herramienta
    // no borra nada; valida el objetivo y devuelve el bloque de acción que el
    // modelo debe incluir al final de su respuesta. El frontend lo pinta como
    // widget con botones Confirmar/Cancelar y solo al confirmar se ejecuta el
    // borrado real (POST /api/finance/confirm-action).
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'delete_transaction',
          description: 'Propone eliminar una transacción del usuario (el borrado real ocurre cuando el usuario pulsa Confirmar en el widget). Si no conoces el id, primero usa get_user_transactions.',
          parameters: {
            type: 'object',
            properties: {
              transactionId: { type: 'string', description: 'Id exacto de la transacción a eliminar' }
            },
            required: ['transactionId']
          }
        }
      },
      execute: async (userId, args, db) => {
        const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND userId = ?').get(args.transactionId, userId) as any;
        if (!tx) return { success: false, error: 'Transacción no encontrada. Usa get_user_transactions para obtener el id correcto.' };

        const acc = db.prepare('SELECT name FROM accounts WHERE id = ?').get(tx.accountId) as any;
        const block = `<<<ACTION_START>>>${JSON.stringify({
          actionType: 'delete_transaction',
          transactionId: tx.id,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: `Eliminar: ${tx.description || tx.category} (${tx.type === 'income' ? 'ingreso' : 'gasto'} de ${tx.amount})`,
          accountName: acc?.name || 'Cuenta'
        })}<<<ACTION_END>>>`;

        return {
          success: true,
          requiresConfirmation: true,
          pendingDeletion: { id: tx.id, type: tx.type, amount: tx.amount, category: tx.category, description: tx.description },
          instruction: `NO está borrado todavía. Incluye este bloque EXACTO al final de tu respuesta para que el usuario confirme con un botón: ${block}`
        };
      }
    });

    // 4e. Borrado de deudas/préstamos, también con confirmación por widget.
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'delete_debt',
          description: 'Propone eliminar una deuda o préstamo (el borrado real ocurre cuando el usuario pulsa Confirmar en el widget). Si no conoces el id, usa get_user_debts primero.',
          parameters: {
            type: 'object',
            properties: {
              debtId: { type: 'string', description: 'Id exacto de la deuda/préstamo a eliminar' }
            },
            required: ['debtId']
          }
        }
      },
      execute: async (userId, args, db) => {
        const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND userId = ?').get(args.debtId, userId) as any;
        if (!debt) return { success: false, error: 'Deuda no encontrada. Usa get_user_debts para obtener el id correcto.' };

        const block = `<<<ACTION_START>>>${JSON.stringify({
          actionType: 'delete_debt',
          debtId: debt.id,
          amount: debt.amount,
          description: `Eliminar ${debt.type === 'receivable' ? 'préstamo a' : 'deuda con'} ${debt.personOrEntity}: ${debt.name} (${debt.amount})`,
          accountName: debt.personOrEntity
        })}<<<ACTION_END>>>`;

        return {
          success: true,
          requiresConfirmation: true,
          pendingDeletion: { id: debt.id, personOrEntity: debt.personOrEntity, amount: debt.amount, type: debt.type },
          instruction: `NO está borrado todavía. Incluye este bloque EXACTO al final de tu respuesta para que el usuario confirme con un botón: ${block}`
        };
      }
    });

    // 5. Herramienta de Envío de Notificación Personal (Notification Tool)
    this.registerTool({
      definition: {
        type: 'function',
        function: {
          name: 'send_user_notification',
          description: 'Envía una notificación personal al buzón/campana del usuario sobre alertas, metas o presupuestos',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Título de la notificación' },
              message: { type: 'string', description: 'Cuerpo del mensaje' },
              type: { type: 'string', enum: ['info', 'warning', 'success', 'alert'], description: 'Tipo de aviso' }
            },
            required: ['title', 'message']
          }
        }
      },
      execute: async (userId, args, db) => {
        const id = 'notif-' + Math.random().toString(36).substring(2, 9);
        const { title, message, type } = args;
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO user_notifications (id, userId, title, message, type, isRead, createdAt)
          VALUES (?, ?, ?, ?, ?, 0, ?)
        `).run(id, userId, title, message, type || 'info', now);

        return { success: true, notificationId: id, title };
      }
    });
  }
}
