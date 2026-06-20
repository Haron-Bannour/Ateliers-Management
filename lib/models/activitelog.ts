import mongoose, { Schema, model, models } from "mongoose";

// Collection MongoDB — données append-only, pas relationnelles
// Justification jury : les logs d'activité sont nombreux, flexibles et ne nécessitent
// pas d'intégrité référentielle → parfait pour NoSQL
export type TypeAction =
  | "RESERVATION_CONFIRMEE"
  | "RESERVATION_ANNULEE"
  | "ATELIER_CREE"
  | "ATELIER_MODIFIE"
  | "ATELIER_SUPPRIME"
  | "CONNEXION";

export interface IActivityLog {
  action: TypeAction;
  details: string;
  userId?: string;
  membre?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action:  { type: String, required: true },
    details: { type: String, required: true },
    userId:  { type: String },   // optionnel — certaines actions sont système
    membre:  { type: String },   // nom lisible du membre pour affichage
  },
  { timestamps: { createdAt: true, updatedAt: false } } // append-only : pas d'updatedAt
);

// models["ActivityLog"] || model(...) : évite la re-déclaration du modèle lors des
// hot-reloads Next.js
export const ActivityLog =
  (models["ActivityLog"] as mongoose.Model<IActivityLog>) ??
  model<IActivityLog>("ActivityLog", ActivityLogSchema);
