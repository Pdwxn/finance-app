import cron from 'node-cron';
import { isNull } from 'drizzle-orm';
import { db } from '../config/db';
import { users } from '../db/schema/users';
import { generateWeeklyReport, generateMonthlyReport } from './report-generator';

function log(msg: string) {
  console.log(`[Scheduler] ${new Date().toISOString()} - ${msg}`);
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
  processAllUsers(generateWeeklyReport);
});

cron.schedule('0 8 1 * *', () => {
  log('Iniciando generación de reportes mensuales...');
  processAllUsers(generateMonthlyReport);
});

log('Scheduler inicializado');
