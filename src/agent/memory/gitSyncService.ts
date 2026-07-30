import { exec } from 'child_process';
import path from 'path';

/**
 * SERVICIO DE SINCRONIZACIÓN DE OBSIDIAN CON GITHUB (GitSyncService)
 * 
 * Se encarga de hacer git commit & push automático del directorio /obsidian-vault/
 * hacia el repositorio privado de GitHub del usuario tras cada aprendizaje.
 */

export class GitSyncService {
  private vaultPath: string;

  constructor(vaultPath?: string) {
    this.vaultPath = vaultPath || path.join(process.cwd(), 'obsidian-vault');
  }

  /**
   * Ejecuta commit y push asíncrono en segundo plano
   */
  public async syncVaultToGitHub(commitMessage: string = 'Update Obsidian Vault memory'): Promise<void> {
    const cmd = `cd "${this.vaultPath}" && git add . && git commit -m "${commitMessage}" && git push origin main`;

    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          // Si el directorio no es aún un repo git o no hay remotos configurados, loguea suavemente sin interrumpir
          console.log(`[GitSyncService] Nota guardada localmente en Obsidian (Git Sync opcional): ${error.message}`);
          return resolve();
        }
        console.log(`[GitSyncService] Vault sincronizado con GitHub con éxito.`);
        resolve();
      });
    });
  }
}
