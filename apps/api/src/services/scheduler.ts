import cron from 'node-cron';
import { isNull } from 'drizzle-orm';
import { db } from '../config/db';
import { users } from '../db/schema/users';
import { generateWeeklyReport, generateMonthlyReport } from './report-generator';

function log(msg: string) {
  console.log(`[Scheduler] ${new Date().toISOString()} - ${msg}`);
}

/**
 * El cron corre al INICIO del período (lunes 8am / día 1 8am), momento en el
 * que ese período recién comienza y no tiene movimientos todavía. Para que
 * el reporte resuma el período que ACABA de cerrar, usamos una fecha de
 * referencia de ayer, que cae dentro de la semana/mes anterior.
 */
function referenceDateForClosedPeriod(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

async function processAllUsers(generator: (userId: string) => Promise<void>) {
  try {
    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(isNull(users.deletedAt));

    log(`Procesando ${allUsers.length} usuarios...`);

    for (const user of allUsers) {
      try {
        await generator(user.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        log(`Error con usuario ${user.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    log('Procesamiento completado');
  } catch (error) {
    log(`Error obteniendo usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

cron.schedule('0 8 * * 1', () => {
  log('Iniciando generación de reportes semanales...');
  const referenceDate = referenceDateForClosedPeriod();
  processAllUsers(userId => generateWeeklyReport(userId, referenceDate));
});

cron.schedule('0 8 1 * *', () => {
  log('Iniciando generación de reportes mensuales...');
  const referenceDate = referenceDateForClosedPeriod();
  processAllUsers(userId => generateMonthlyReport(userId, referenceDate));
});

log('Scheduler inicializado');
