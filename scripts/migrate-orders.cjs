// Script: migra pedidos do Supabase antigo para o novo
const OLD_URL = 'https://lfqquhqmprcvghjxkoob.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXF1aHFtcHJjdmdoanhrb29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1ODAxMCwiZXhwIjoyMDkwMDM0MDEwfQ.FBVyClhhGv8FQvtmu_aXBdCvs91CV1sfTf5Oxd-vBRU';

const NEW_URL = 'https://nkaxnkxqazqvtejwxthy.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYXhua3hxYXpxdnRland4dGh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMzQ5MSwiZXhwIjoyMDk2NTk5NDkxfQ.oR2dsUqP2IhGEED9HGZxRhZg_ofdIKoSrZIvM8M9H_c';

async function migrate() {
  console.log('Buscando pedidos do Supabase antigo...');

  let orders = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const res = await fetch(
      `${OLD_URL}/rest/v1/orders?store_id=eq.pointdosom&select=*&limit=${limit}&offset=${offset}`,
      { headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` } }
    );
    const batch = await res.json();
    if (!Array.isArray(batch)) { console.error('Erro ao buscar:', batch); return; }
    orders = orders.concat(batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  console.log(`Total de pedidos encontrados: ${orders.length}`);
  if (!orders.length) { console.log('Nenhum pedido para migrar.'); return; }

  const insertRes = await fetch(`${NEW_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      apikey: NEW_KEY,
      Authorization: `Bearer ${NEW_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(orders),
  });

  if (insertRes.ok || insertRes.status === 201) {
    console.log(`Migração concluída! ${orders.length} pedidos importados no novo Supabase.`);
  } else {
    const err = await insertRes.text();
    console.error('Erro ao inserir:', insertRes.status, err);
  }
}

migrate().catch(console.error);
