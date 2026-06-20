"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type TypeAction =
  | "RESERVATION_CONFIRMEE"
  | "RESERVATION_ANNULEE"
  | "ATELIER_CREE"
  | "ATELIER_MODIFIE"
  | "ATELIER_SUPPRIME"
  | "CONNEXION"
  | "TOUS";

interface EntreeJournal {
  _id: string;
  action: TypeAction;
  details: string;
  membre?: string;
  createdAt: string;
}

const FILTRES: { label: string; valeur: TypeAction }[] = [
  { label: "Tout", valeur: "TOUS" },
  { label: "Réservations", valeur: "RESERVATION_CONFIRMEE" },
  { label: "Annulations", valeur: "RESERVATION_ANNULEE" },
  { label: "Ateliers", valeur: "ATELIER_CREE" },
  { label: "Connexions", valeur: "CONNEXION" },
];

const BADGE: Record<string, { label: string; classe: string }> = {
  RESERVATION_CONFIRMEE: { label: "Réservation",    classe: "bg-green-100 text-green-700" },
  RESERVATION_ANNULEE:   { label: "Annulation",     classe: "bg-red-100 text-red-700" },
  ATELIER_CREE:          { label: "Atelier créé",   classe: "bg-blue-100 text-blue-700" },
  ATELIER_MODIFIE:       { label: "Atelier modifié",classe: "bg-yellow-100 text-yellow-700" },
  ATELIER_SUPPRIME:      { label: "Atelier supprimé",classe: "bg-red-100 text-red-700" },
  CONNEXION:             { label: "Connexion",      classe: "bg-gray-100 text-gray-600" },
};

function formatDateHeure(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminJournalPage() {
  const router = useRouter();
  const [entrees, setEntrees] = useState<EntreeJournal[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtreActif, setFiltreActif] = useState<TypeAction>("TOUS");

  useEffect(() => {
    const params = filtreActif !== "TOUS" ? `?action=${filtreActif}` : "";
    setChargement(true);
    fetch(`/api/admin/journal${params}`).then(async (res) => {
      if (res.status === 403) { router.push("/connexion"); return; }
      setEntrees(await res.json());
      setChargement(false);
    });
  }, [filtreActif, router]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Journal d&apos;activité</h1>
        <p className="mt-1 text-sm text-gray-500">
          Historique des actions — stocké dans MongoDB (append-only)
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.valeur}
            onClick={() => setFiltreActif(f.valeur)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              filtreActif === f.valeur
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {chargement ? (
        <div className="py-16 text-center text-sm text-gray-400">Chargement…</div>
      ) : entrees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">Aucune entrée pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entrees.map((e) => {
            const badge = BADGE[e.action] ?? { label: e.action, classe: "bg-gray-100 text-gray-600" };
            return (
              <div key={e._id} className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4">
                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classe}`}>
                  {badge.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{e.details}</p>
                  {e.membre && <p className="mt-0.5 text-xs text-gray-400">{e.membre}</p>}
                </div>
                <span className="shrink-0 text-xs text-gray-400">{formatDateHeure(e.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
