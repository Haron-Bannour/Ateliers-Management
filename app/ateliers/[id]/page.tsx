"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Atelier {
  id: string;
  titre: string;
  theme: string;
  description: string;
  date: string;
  lieu: string;
  capacite: number;
  reservations: number;
}

interface User {
  id: string;
  nom: string;
  role: "MEMBRE" | "ADMIN";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function DetailAtelierPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [atelier, setAtelier] = useState<Atelier | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [reservationFaite, setReservationFaite] = useState(false);
  const [erreurReservation, setErreurReservation] = useState<string | null>(null);
  const [reservationEnCours, setReservationEnCours] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/ateliers/${id}`),
      fetch("/api/auth/me"),
    ]).then(async ([atelierRes, meRes]) => {
      if (atelierRes.status === 404) { setIntrouvable(true); setChargement(false); return; }
      const [atelierData, userData] = await Promise.all([atelierRes.json(), meRes.ok ? meRes.json() : null]);
      setAtelier(atelierData);
      setUser(userData);
      setChargement(false);
    });
  }, [id]);

  async function deconnecter() {
    await fetch("/api/auth/deconnexion", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  async function reserver() {
    if (!user) { router.push("/connexion"); return; }
    setErreurReservation(null);
    setReservationEnCours(true);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atelierId: id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErreurReservation(data.message ?? "Une erreur est survenue.");
      setReservationEnCours(false);
      return;
    }

    setReservationFaite(true);
    // Met à jour le compteur localement sans refetch
    setAtelier((prev) => prev ? { ...prev, reservations: prev.reservations + 1 } : prev);
    setReservationEnCours(false);
  }

  if (chargement) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-sm text-gray-400">Chargement…</p></div>;
  }

  if (introuvable || !atelier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-500">Atelier introuvable.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-gray-900 hover:underline">Retour à l&apos;accueil</Link>
        </div>
      </div>
    );
  }

  const placesRestantes = atelier.capacite - atelier.reservations;
  const complet = placesRestantes === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">ReservA</Link>
          <nav className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {user ? (
              <>
                <Link href="/mes_reservations" className="text-sm text-gray-600 hover:text-gray-900">{user.nom}</Link>
                <button onClick={deconnecter} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">Déconnexion</button>
              </>
            ) : (
              <>
                <Link href="/connexion" className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">Connexion</Link>
                <Link href="/inscription" className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700">S&apos;inscrire</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux ateliers
        </Link>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="mb-4 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{atelier.theme}</span>
          <h1 className="mb-6 text-2xl font-semibold text-gray-900">{atelier.titre}</h1>

          <div className="mb-6 space-y-3 rounded-md bg-gray-50 p-4">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="capitalize">{formatDate(atelier.date)} à {formatHeure(atelier.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{atelier.lieu}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {complet ? (
                <span className="font-medium text-red-600">Complet ({atelier.capacite}/{atelier.capacite})</span>
              ) : placesRestantes <= 3 ? (
                <span className="font-medium text-orange-600">{placesRestantes} place{placesRestantes > 1 ? "s" : ""} restante{placesRestantes > 1 ? "s" : ""} sur {atelier.capacite}</span>
              ) : (
                <span className="text-gray-700">{placesRestantes} places disponibles sur {atelier.capacite}</span>
              )}
            </div>
          </div>

          <p className="mb-8 leading-relaxed text-gray-600">{atelier.description}</p>

          {erreurReservation && (
            <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{erreurReservation}</p>
          )}

          {reservationFaite ? (
            <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              Votre place est réservée ! Retrouvez-la dans{" "}
              <Link href="/mes_reservations" className="font-medium underline">Mes réservations</Link>.
            </div>
          ) : (
            <button
              onClick={reserver}
              disabled={complet || reservationEnCours}
              className="w-full rounded-md bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reservationEnCours ? "Réservation en cours…" : complet ? "Atelier complet" : user ? "Réserver ma place" : "Se connecter pour réserver"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
