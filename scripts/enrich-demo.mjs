/**
 * Enriquece dados demo para apresentação (insights, notificação, proposta).
 */
import pg from 'pg';

const url =
  process.env.DATABASE_URL ||
  'postgresql://subscriptionhub:subscriptionhub@127.0.0.1:5435/subscriptionhub?schema=public';

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows: users } = await client.query(
  `SELECT id FROM users WHERE email = 'demo@subscriptionhub.local' LIMIT 1`,
);
if (!users[0]) {
  console.error('Demo user not found. Run seed first.');
  process.exit(1);
}
const userId = users[0].id;

await client.query(
  `UPDATE subscriptions SET unused = true WHERE "userId" = $1 AND name = 'iCloud+'`,
  [userId],
);

await client.query(`DELETE FROM insights WHERE "userId" = $1`, [userId]);
await client.query(
  `INSERT INTO insights (id, "userId", type, title, body, severity, data, "createdAt")
   VALUES
   (gen_random_uuid(), $1, 'unused', 'Assinatura sem uso detectada',
    'iCloud+ está marcada como sem uso. Economia potencial de cerca de R$ 3,50/mês se cancelar.',
    'warning', '{}', NOW()),
   (gen_random_uuid(), $1, 'forecast_7d', 'Próximos 7 dias',
    'Há cobranças programadas nos próximos dias. Revise o calendário para evitar surpresas.',
    'info', '{}', NOW()),
   (gen_random_uuid(), $1, 'redundant', 'Possível sobreposição',
    'Você tem serviços de streaming e música. Vale revisar se todos estão em uso ativo.',
    'info', '{}', NOW())`,
  [userId],
);

await client.query(`DELETE FROM notifications WHERE "userId" = $1`, [userId]);
await client.query(
  `INSERT INTO notifications (id, "userId", type, channel, title, body, "sentAt", "createdAt", "idempotencyKey")
   VALUES
   (gen_random_uuid(), $1, 'SAVINGS', 'IN_APP', 'Economia possível',
    'Cancelar serviços sem uso pode liberar orçamento mensal. Abra o Dashboard.',
    NOW(), NOW(), 'demo-savings-1'),
   (gen_random_uuid(), $1, 'CHARGE_TOMORROW', 'IN_APP', 'Cobrança amanhã',
    'Netflix será cobrada em breve. Valor na lista de assinaturas.',
    NOW(), NOW(), 'demo-charge-1')`,
  [userId],
);

// Proposta de detecção pendente para demo do fluxo de confirmação
const { rows: pending } = await client.query(
  `SELECT id FROM detection_proposals WHERE "userId" = $1 AND status = 'PENDING' LIMIT 1`,
  [userId],
);
if (!pending[0]) {
  await client.query(
    `INSERT INTO detection_proposals (
      id, "userId", status, "suggestedName", "suggestedCompany", "suggestedAmount",
      currency, "suggestedPeriod", confidence, source, "evidenceEventIds", rationale, "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), $1, 'PENDING', 'YouTube Premium', 'Google', 2490,
      'BRL', 'MONTHLY', 0.87, 'OPEN_FINANCE', ARRAY[]::uuid[],
      '3 cobranças com intervalo ~30 dias e valor estável detectadas via Open Finance (demo)',
      NOW(), NOW()
    )`,
    [userId],
  );
}

console.log('Demo data enriched for presentation.');
await client.end();
