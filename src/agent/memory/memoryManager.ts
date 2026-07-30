import fs from 'fs';
import path from 'path';
import { GitSyncService } from './gitSyncService.ts';

export interface MemoryContext {
  shortMemory: { role: string; content: string }[];
  workingMemory: Record<string, any>;
  longTermMemorySnippet: string;
  relevantSemanticNotes: string[];
}

export class MemoryManager {
  private vaultPath: string;
  private gitSyncService: GitSyncService;
  private workingMemory: Map<string, Record<string, any>> = new Map(); // userId -> scratchpad

  constructor(vaultPath?: string) {
    this.vaultPath = vaultPath || path.join(process.cwd(), 'obsidian-vault');
    this.gitSyncService = new GitSyncService(this.vaultPath);
    this.ensureVaultStructure();
  }

  /**
   * Garantiza la existencia del directorio Obsidian Vault con su estructura inicial
   */
  private ensureVaultStructure() {
    if (!fs.existsSync(this.vaultPath)) {
      fs.mkdirSync(this.vaultPath, { recursive: true });
    }

    const subDirs = ['patron_comportamientos', 'resumenes_mensuales', 'aprendizajes', 'metas'];
    for (const dir of subDirs) {
      const fullPath = path.join(this.vaultPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    // Inicializar PERFIL_USUARIO.md si no existe
    const profilePath = path.join(this.vaultPath, 'PERFIL_USUARIO.md');
    if (!fs.existsSync(profilePath)) {
      const initialProfile = `---
tipo: perfil_general
ultima_actualizacion: "${new Date().toISOString()}"
tolerancia_riesgo: "Moderada"
estilo_comunicacion: "Equilibrado, claro y directo"
---

# Perfil Financiero Aprendido
- **Preferencias Iniciales:** Asesoramiento patrimonial, control de gastos e incremento de ahorro.
`;
      fs.writeFileSync(profilePath, initialProfile, 'utf-8');
    }
  }

  /**
   * Nivel 1 & 2: Recupera Working Memory
   */
  public getWorkingMemory(userId: string): Record<string, any> {
    return this.workingMemory.get(userId) || {};
  }

  public setWorkingMemory(userId: string, data: Record<string, any>) {
    const current = this.getWorkingMemory(userId);
    this.workingMemory.set(userId, { ...current, ...data });
  }

  public clearWorkingMemory(userId: string) {
    this.workingMemory.delete(userId);
  }

  /**
   * Nivel 3: Long Term Memory - Lee notas clave de Obsidian Vault
   */
  public readObsidianNote(filename: string): string {
    const filePath = path.join(this.vaultPath, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  }

  public writeObsidianNote(filename: string, content: string): void {
    const filePath = path.join(this.vaultPath, filename);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');

    // Sincronizar automáticamente con el repositorio de GitHub si está configurado
    this.gitSyncService.syncVaultToGitHub(`Update note ${filename}`)
      .catch(e => console.error('[GitSyncService Error]:', e));
  }

  /**
   * Nivel 4: Semantic Memory - Búsqueda Semántica
   * Realiza un escaneo por relevancia de palabras clave y concepto sobre las notas de Obsidian
   */
  public searchSemanticMemory(query: string): string[] {
    const results: string[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);

    const scanDirectory = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (file.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lowerContent = content.toLowerCase();

          let matches = 0;
          for (const term of queryTerms) {
            if (lowerContent.includes(term)) {
              matches++;
            }
          }

          if (matches > 0) {
            results.push(`--- NOTA: ${path.relative(this.vaultPath, fullPath)} ---\n${content}`);
          }
        }
      }
    };

    scanDirectory(this.vaultPath);
    return results.slice(0, 3); // Devolver hasta las 3 notas más relevantes
  }

  /**
   * Obtiene el snippet de contexto compuesto de memoria para inyectar en el LLM
   */
  public buildMemoryContextSnippet(userId: string, userMessage: string): string {
    const profile = this.readObsidianNote('PERFIL_USUARIO.md');
    const semanticNotes = this.searchSemanticMemory(userMessage);

    let snippet = `=== MEMORIA OBSIDIAN (LONG-TERM) ===\n${profile}\n`;

    if (semanticNotes.length > 0) {
      snippet += `\n=== NOTAS SEMÁNTICAS RECUPERADAS DE OBSIDIAN ===\n${semanticNotes.join('\n\n')}\n`;
    }

    return snippet;
  }
}
