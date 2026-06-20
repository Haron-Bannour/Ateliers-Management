import { connecterMongo } from "./mongodb";
import { ActivityLog, type TypeAction } from "./models/activitelog";

export async function logActivite(
  action: TypeAction,
  details: string,
  opts?: { userId?: string; membre?: string }
) {
  try {
    await connecterMongo();
    await ActivityLog.create({ action, details, ...opts });
  } catch (err) {
    // On ne bloque jamais l'action métier si le log échoue
    console.error("[logActivite] erreur MongoDB :", err);
  }
}
