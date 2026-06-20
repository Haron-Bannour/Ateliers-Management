"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Statut = "CONFIRMEE" | "ANNULEE";

interface Reservation {
  id: string;
  statut: Statut;
  createdAt: string;
  user: { nom: string; email: string };
  atelier: { id: string; titre: string; date: string; capacite: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [atelierActif, setAtelierActif] = useState("tous");

  useEffect(() => {
    fetch("/api/admin/reservations").then(async (res) => {
      if (res.status === 403) { router.push("/connexion"); return; }
      setReservations(await res.json());
      setChargement(false);
    });
  }, [router]);

  // Construit la liste unique des ateliers pour les filtres
  const ateliers = Array.from(
    new Map(reservations.map((r) => [r.atelier.id, r.atelier])).values()
  );

  const reservationsFiltrees =
    atelierActif === "tous" ? reservations : reservations.filter((r) => r.atelier.id === atelierActif);

  const confirmees = reservationsFiltrees.filter((r) => r.statut === "CONFIRMEE").length;
  const annulees = reservationsFiltrees.filter((r) => r.statut === "ANNULEE").length;

  if (chargement) {
    return <div className="py-16 text-center text-sm text-gray-400">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Réservations</h1>
        <p className="mt-1 text-sm text-gray-500">
          {confirmees} confirmée{confirmees !== 1 ? "s" : ""} · {annulees} annulée{annulees !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filtres par atelier */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setAtelierActif("tous")}
          className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${atelierActif === "tous" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"}`}
        >
          Tous
        </button>
        {ateliers.map((a) => (
          <button
            key={a.id}
            onClick={() => setAtelierActif(a.id)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${atelierActif === a.id ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"}`}
          >
            {a.titre}
          </button>
        ))}
      </div>

      {reservationsFiltrees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">Aucune réservation pour cet atelier.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Membre</th>
                <th className="hidden px-5 py-3 sm:table-cell">Atelier</th>
                <th className="hidden px-5 py-3 md:table-cell">Date atelier</th>
                <th className="px-5 py-3">Statut</th>
                <th className="hidden px-5 py-3 lg:table-cell">Réservé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservationsFiltrees.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{r.user.nom}</p>
                    <p className="text-xs text-gray-400">{r.user.email}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-gray-600 sm:table-cell">{r.atelier.titre}</td>
                  <td className="hidden px-5 py-4 text-gray-600 md:table-cell">
                    <p>{formatDate(r.atelier.date)}</p>
                    <p className="text-xs text-gray-400">{formatHeure(r.atelier.date)}</p>
                  </td>
                  <td className="px-5 py-4">
                    {r.statut === "CONFIRMEE" ? (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Confirmée</span>
                    ) : (
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">Annulée</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-4 text-xs text-gray-400 lg:table-cell">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
