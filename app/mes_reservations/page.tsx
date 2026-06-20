"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Statut = "CONFIRMEE" | "ANNULEE";

interface Reservation {
  id: string;
  statut: Statut;
  atelier: { id: string; titre: string; theme: string; date: string; lieu: string };
}

interface User { id: string; nom: string; role: "MEMBRE" | "ADMIN" }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function estPassee(iso: string) {
  return new Date(iso) < new Date();
}

export default function MesReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);
  const [annulationEnCours, setAnnulationEnCours] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/mes-reservations"),
      fetch("/api/auth/me"),
    ]).then(async ([resRes, meRes]) => {
      if (resRes.status === 401) { router.push("/connexion"); return; }
      const [resData, userData] = await Promise.all([resRes.json(), meRes.ok ? meRes.json() : null]);
      setReservations(resData);
      setUser(userData);
      setChargement(false);
    });
  }, [router]);

  async function deconnecter() {
    await fetch("/api/auth/deconnexion", { method: "POST" });
    router.push("/");
  }

  async function annuler(id: string) {
    setAnnulationEnCours(id);
    const res = await fetch(`/api/reservations/${id}/annuler`, { method: "PATCH" });
    if (res.ok) {
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, statut: "ANNULEE" } : r));
    }
    setAnnulationEnCours(null);
  }

  const actives = reservations.filter((r) => r.statut === "CONFIRMEE");
  const annulees = reservations.filter((r) => r.statut === "ANNULEE");

  if (chargement) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-sm text-gray-400">Chargement…</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">ReservA</Link>
          <nav className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {user && <span className="text-sm text-gray-600">{user.nom}</span>}
            <button onClick={deconnecter} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">Déconnexion</button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Mes réservations</h1>
        <p className="mb-8 text-sm text-gray-500">{actives.length} réservation{actives.length !== 1 ? "s" : ""} active{actives.length !== 1 ? "s" : ""}</p>

        {actives.length === 0 ? (
          <div className="mb-8 rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center">
            <p className="text-sm text-gray-500">Aucune réservation active.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-medium text-gray-900 hover:underline">Parcourir les ateliers →</Link>
          </div>
        ) : (
          <div className="mb-10 space-y-3">
            {actives.map((r) => {
              const passee = estPassee(r.atelier.date);
              return (
                <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="mb-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{r.atelier.theme}</span>
                      <h2 className="mb-1 text-base font-semibold text-gray-900">{r.atelier.titre}</h2>
                      <div className="space-y-0.5 text-xs text-gray-500">
                        <p className="capitalize">{formatDate(r.atelier.date)} à {formatHeure(r.atelier.date)}</p>
                        <p>{r.atelier.lieu}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Confirmée</span>
                      {!passee ? (
                        <button onClick={() => annuler(r.id)} disabled={annulationEnCours === r.id} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
                          {annulationEnCours === r.id ? "Annulation…" : "Annuler"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Atelier passé</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {annulees.length > 0 && (
          <>
            <h2 className="mb-3 text-sm font-medium text-gray-500">Historique</h2>
            <div className="space-y-3">
              {annulees.map((r) => (
                <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-5 opacity-60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="mb-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">{r.atelier.theme}</span>
                      <h2 className="mb-1 text-base font-medium text-gray-700 line-through decoration-gray-400">{r.atelier.titre}</h2>
                      <p className="text-xs capitalize text-gray-400">{formatDate(r.atelier.date)} à {formatHeure(r.atelier.date)}</p>
                    </div>
                    <span className="inline-block shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">Annulée</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
