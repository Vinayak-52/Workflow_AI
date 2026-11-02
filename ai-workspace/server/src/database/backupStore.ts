/**
 * Database Backup Service and Rules
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Week 7 Milestone: Prepare cloud deployment configuration, API documentation, and backup rules
 */

import fs from 'fs';
import path from 'path';

export function performBackup(backupLabel: string = 'manual') {
  const dataDir = path.resolve(process.cwd(), 'data');
  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const sourceFile = path.join(dataDir, 'firestore_store.json');
  if (!fs.existsSync(sourceFile)) {
    console.warn('[Backup] No database file found to backup.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetFile = path.join(backupDir, `backup_${backupLabel}_${timestamp}.json`);

  fs.copyFileSync(sourceFile, targetFile);
  console.log(`[Backup] Created snapshot: ${targetFile}`);

  // Maintain sliding window of 14 recent backups
  const existing = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_')).sort();
  while (existing.length > 14) {
    const toRemove = existing.shift();
    if (toRemove) {
      fs.unlinkSync(path.join(backupDir, toRemove));
      console.log(`[Backup] Pruned historical snapshot: ${toRemove}`);
    }
  }
}

if (process.argv.includes('--run')) {
  performBackup('cli');
}
