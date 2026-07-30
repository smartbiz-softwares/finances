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

        db.prepare(`
          INSERT INTO transactions (id, userId, type, amount, category, description, date, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, userId, type, amount, category || 'General', description || '', date, new Date().toISOString());

        return { success: true, transactionId: id, amount, type, category };
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
