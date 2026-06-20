import mongoose from "mongoose";

// MongoDB est utilisé pour les données append-only (journal, notifications).
// Même pattern singleton que Prisma : on réutilise la connexion entre les requêtes en dev.
const MONGODB_URI = process.env.MONGODB_URI ?? "";

const globalForMongo = global as unknown as { mongooseConn: typeof mongoose | null };

export async function connecterMongo() {
  if (globalForMongo.mongooseConn?.connection.readyState === 1) {
    return; // déjà connecté
  }
  globalForMongo.mongooseConn = await mongoose.connect(MONGODB_URI);
}
