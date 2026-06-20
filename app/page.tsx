"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const THEMES = ["Tous", "Artisanat", "Peinture", "Bien-être", "Photographie", "Cuisine"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function BadgePlaces({ capacite, reservations }: { capacite: number; reservations: number }) {
  const restantes = capacite - reservations;
  if (restantes === 0)
    return <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Complet</span>;
  if (restantes <= 3)
    return <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">{restantes} place{restantes > 1 ? "s" : ""} restante{restantes > 1 ? "s" : ""}</span>;
  return <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">{restantes} places disponibles</span>;
}

export default function HomePage() {
  const router = useRouter();
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [themeActif, setThemeActif] = useState("Tous");

  useEffect(() => {
    // Chargement parallèle des ateliers et de la session
    Promise.all([
      fetch("/api/ateliers").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
    ]).then(([ateliersData, userData]) => {
      setAteliers(ateliersData);
      setUser(userData);
      setChargement(false);
    });
  }, []);

  async function deconnecter() {
    await fetch("/api/auth/deconnexion", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  const ateliersFiltres = ateliers.filter((a) => {
    const matchTheme = themeActif === "Tous" || a.theme === themeActif;
    const matchRecherche =
      recherche === "" ||
      a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.description.toLowerCase().includes(recherche.toLowerCase()) ||
      a.lieu.toLowerCase().includes(recherche.toLowerCase());
    return matchTheme && matchRecherche;
  });

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
                {user.role === "ADMIN" && (
                  <Link href="/admin/ateliers" className="text-sm font-medium text-gray-600 hover:text-gray-900">Admin</Link>
                )}
                <Link href="/mes_reservations" className="text-sm text-gray-600 hover:text-gray-900">{user.nom}</Link>
                <button onClick={deconnecter} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
                  Déconnexion
                </button>
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Ateliers disponibles</h1>
          <p className="mt-1 text-sm text-gray-500">Parcourez les ateliers et réservez votre place en quelques clics.</p>
        </div>

        {/* Recherche + filtres */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un atelier..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => setThemeActif(theme)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${themeActif === theme ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"}`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <div className="py-16 text-center text-sm text-gray-400">Chargement…</div>
        ) : ateliersFiltres.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-sm text-gray-500">Aucun atelier ne correspond à votre recherche.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">{ateliersFiltres.length} atelier{ateliersFiltres.length !== 1 ? "s" : ""} trouvé{ateliersFiltres.length !== 1 ? "s" : ""}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ateliersFiltres.map((atelier) => {
                const complet = atelier.capacite - atelier.reservations === 0;
                return (
                  <Link
                    key={atelier.id}
                    href={`/ateliers/${atelier.id}`}
                    className="group flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="mb-3 self-start rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{atelier.theme}</span>
                    <h2 className="mb-2 text-base font-semibold text-gray-900 group-hover:text-gray-700">{atelier.titre}</h2>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">{atelier.description}</p>
                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="capitalize">{formatDate(atelier.date)} à {formatHeure(atelier.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{atelier.lieu}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <BadgePlaces capacite={atelier.capacite} reservations={atelier.reservations} />
                      <span className={`text-xs font-medium ${complet ? "text-gray-400" : "text-gray-900 group-hover:underline"}`}>
                        {complet ? "Indisponible" : "Voir →"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
