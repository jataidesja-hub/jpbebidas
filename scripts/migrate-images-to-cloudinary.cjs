/**
 * migrate-images-to-cloudinary.cjs
 * 
 * Migra todas as imagens do Supabase Storage para Cloudinary.
 * Atualiza os campos imageUrl e mediaUrls nos produtos.
 * 
 * Uso:
 *   node scripts/migrate-images-to-cloudinary.cjs \
 *     --supabase-url=https://XXXX.supabase.co \
 *     --supabase-key=eyJ... \
 *     --cloud-name=daffg0p8g \
 *     --upload-preset=ml_default \
 *     --store-id=1
 */

const https = require('https');
const http = require('http');
const { FormData, Blob } = require('buffer');

// ── Parse args ──────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  })
);

const SUPABASE_URL   = args['supabase-url'];
const SUPABASE_KEY   = args['supabase-key'];
const CLOUD_NAME     = args['cloud-name']     || 'daffg0p8g';
const UPLOAD_PRESET  = args['upload-preset']  || 'ml_default';
const STORE_ID       = args['store-id']       || '1';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: Passe --supabase-url e --supabase-key');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
    }).on('error', reject);
  });
}

async function uploadToCloudinary(imageUrl) {
  const { buffer, contentType } = await downloadBuffer(imageUrl);

  // Montar multipart/form-data manualmente
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const filename = 'image.jpg';

  const pre = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([pre, buffer, post]);

  const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    },
    body,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(JSON.stringify(json)));
        } catch { reject(new Error(data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function isSupabaseUrl(url) {
  return url && url.includes('supabase');
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Iniciando migração Supabase → Cloudinary`);
  console.log(`   Store ID: ${STORE_ID}`);
  console.log(`   Cloudinary: ${CLOUD_NAME}\n`);

  // Busca produtos
  const { body: products } = await fetchJson(
    `${SUPABASE_URL}/rest/v1/products?store_id=eq.${STORE_ID}&select=id,name,imageUrl,mediaUrls`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  if (!Array.isArray(products)) {
    console.error('Erro ao buscar produtos:', products);
    process.exit(1);
  }

  console.log(`📦 ${products.length} produtos encontrados\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const updates = {};
    let changed = false;

    // imageUrl
    if (isSupabaseUrl(product.imageUrl)) {
      process.stdout.write(`  [${product.name}] imageUrl... `);
      try {
        const newUrl = await uploadToCloudinary(product.imageUrl);
        updates.imageUrl = newUrl;
        changed = true;
        console.log(`✓`);
      } catch (e) {
        console.log(`✗ ${e.message}`);
        errors++;
      }
    }

    // mediaUrls
    if (Array.isArray(product.mediaUrls) && product.mediaUrls.length > 0) {
      const newMediaUrls = [];
      for (const mu of product.mediaUrls) {
        if (isSupabaseUrl(mu)) {
          process.stdout.write(`  [${product.name}] mediaUrl... `);
          try {
            const newUrl = await uploadToCloudinary(mu);
            newMediaUrls.push(newUrl);
            changed = true;
            console.log(`✓`);
          } catch (e) {
            console.log(`✗ ${e.message}`);
            newMediaUrls.push(mu); // mantém original em caso de erro
            errors++;
          }
        } else {
          newMediaUrls.push(mu);
        }
      }
      if (changed) updates.mediaUrls = newMediaUrls;
    }

    if (!changed) { skipped++; continue; }

    // Atualiza no Supabase
    const body = JSON.stringify(updates);
    const res = await fetchJson(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
          'Content-Length': Buffer.byteLength(body),
        },
        body,
      }
    );

    if (res.status >= 200 && res.status < 300) {
      migrated++;
    } else {
      console.error(`  ERRO ao atualizar produto ${product.id}:`, res.body);
      errors++;
    }
  }

  console.log(`\n✅ Migração concluída!`);
  console.log(`   Migrados : ${migrated}`);
  console.log(`   Ignorados: ${skipped} (já no Cloudinary ou sem imagem)`);
  console.log(`   Erros    : ${errors}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
