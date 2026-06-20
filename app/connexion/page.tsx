"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const res = await fetch("/api/auth/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErreur(data.message ?? "Une erreur est survenue.");
      setChargement(false);
      return;
    }

    // Redirection selon le rôle
    router.push(data.role === "ADMIN" ? "/admin/ateliers" : "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-bold tracking-tight text-gray-900">
          ReservA
        </Link>

        <div className="rounded-lg border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <h1 className="mb-6 text-lg font-semibold text-gray-900">Connexion</h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div>
              <label htmlFor="motDePasse" className="mb-1.5 block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="motDePasse"
                type="password"
                autoComplete="current-password"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            {erreur && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              {chargement ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-medium text-gray-900 hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
