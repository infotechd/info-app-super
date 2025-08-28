#!/usr/bin/env node
// Verifica se pnpm.overrides no package.json está alinhado com o bloco overrides no pnpm-lock.yaml
// e certifica que não há lockfiles aninhados em pacotes do workspace.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function parseLockfileOverrides(lockText) {
  const lines = lockText.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /^overrides:\s*$/.test(l.trim()));
  if (startIdx === -1) return {};
  const result = {};
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*$/.test(line)) break; // blank line ends block
    if (/^\s*importers:\s*$/.test(line)) break; // next section
    // Expect lines like: "  'pkg': version" or "  pkg: version"
    const m = line.match(/^\s*(['"]?)([^'"\s:]+)\1:\s*(.+)\s*$/);
    if (!m) continue;
    const [, , key, rawVal] = m;
    const val = rawVal.trim();
    // lockfile may quote versions; keep as-is
    result[key] = val.replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function main() {
  const root = resolve('.');
  const pkgPath = resolve(root, 'package.json');
  const lockPath = resolve(root, 'pnpm-lock.yaml');

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const lockText = readFileSync(lockPath, 'utf-8');

  const pkgOverrides = (pkg.pnpm && pkg.pnpm.overrides) || {};
  const lockOverrides = parseLockfileOverrides(lockText);

  const pkgKeys = Object.keys(pkgOverrides).sort();
  const lockKeys = Object.keys(lockOverrides).sort();

  const missingInPkg = lockKeys.filter((k) => !(k in pkgOverrides));
  const missingInLock = pkgKeys.filter((k) => !(k in lockOverrides));
  const valueMismatches = pkgKeys.filter((k) => lockOverrides[k] && String(pkgOverrides[k]) !== String(lockOverrides[k]));

  let ok = true;
  if (missingInPkg.length) {
    ok = false;
    console.error('[ERROR] Overrides presentes no lockfile e ausentes no package.json:', missingInPkg);
  }
  if (missingInLock.length) {
    ok = false;
    console.error('[ERROR] Overrides presentes no package.json e ausentes no lockfile:', missingInLock);
  }
  if (valueMismatches.length) {
    ok = false;
    console.error('[ERROR] Overrides com versões divergentes:', valueMismatches.map((k) => ({ key: k, pkg: pkgOverrides[k], lock: lockOverrides[k] })));
  }

  // Checagem de lockfiles aninhados
  const mobileLock = resolve(root, 'packages', 'mobile', 'pnpm-lock.yaml');
  if (existsSync(mobileLock)) {
    ok = false;
    console.error('[ERROR] Lockfile aninhado detectado em packages/mobile/pnpm-lock.yaml. Remova-o e mantenha apenas o lockfile da raiz.');
  }

  if (!ok) {
    process.exit(1);
  } else {
    console.log('[OK] pnpm.overrides alinhados entre package.json e pnpm-lock.yaml e nenhum lockfile aninhado detectado.');
  }
}

main();
