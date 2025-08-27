#!/usr/bin/env node
/*
  Teste de conectividade ao backend do Super App.
  - Tenta acessar /api, /api/health e /api/ofertas
  - Usa fetch nativo do Node >=18
  - Permite configurar host/porta via env: API_HOST, API_PORT, API_BASE_PATH
*/

const HOST = process.env.API_HOST || '192.168.1.12';
const PORT = process.env.API_PORT || '4000';
const BASE = process.env.API_BASE_PATH || '/api';
const BASE_URL = `http://${HOST}:${PORT}${BASE}`;

const targets = [
  { path: '', expectJson: true, label: 'API root' },
  { path: '/health', expectJson: true, label: 'Health' },
  { path: '/ofertas', expectJson: true, label: 'Ofertas' },
];

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function logError(msg) {
  process.stderr.write(`${msg}\n`);
}

async function tryFetch(path) {
  const url = `${BASE_URL}${path}`;
  const started = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const ms = Date.now() - started;
    const contentType = res.headers.get('content-type') || '';
    let bodyText = '';
    try {
      if (contentType.includes('application/json')) {
        const data = await res.json();
        bodyText = JSON.stringify(data).slice(0, 200);
      } else {
        bodyText = (await res.text()).slice(0, 200);
      }
    } catch (_) {
      // ignore body parse errors for connectivity test
    }
    return {
      ok: res.ok,
      status: res.status,
      ms,
      url,
      bodyPreview: bodyText,
    };
  } catch (err) {
    const ms = Date.now() - started;
    return {
      ok: false,
      status: 0,
      ms,
      url,
      error: err?.message || String(err),
      code: err?.code,
      cause: err?.cause,
    };
  }
}

(async () => {
  log(`Testing connectivity to ${BASE_URL}`);
  let allOk = true;
  for (const t of targets) {
    const r = await tryFetch(t.path);
    if (r.ok) {
      log(`✔ ${t.label} ${r.url} -> ${r.status} in ${r.ms}ms`);
      if (r.bodyPreview) log(`  Body: ${r.bodyPreview}`);
    } else {
      allOk = false;
      logError(`✖ ${t.label} ${r.url} -> FAILED in ${r.ms}ms`);
      if (r.error) logError(`  Error: ${r.error}`);
      if (r.code) logError(`  Code: ${r.code}`);
      if (r.cause) logError(`  Cause: ${r.cause}`);
    }
  }
  if (!allOk) {
    logError('\nDiagnóstico:');
    logError('- Verifique se o backend está rodando e ouvindo em 0.0.0.0:' + PORT);
    logError('- Confirme o IP do PC (ipconfig). Use API_HOST=<ip> pnpm run test:connection');
    logError('- Verifique firewall do Windows para porta ' + PORT + ' (rede privada).');
    process.exit(1);
  } else {
    log('\nConectividade OK.');
  }
})();
