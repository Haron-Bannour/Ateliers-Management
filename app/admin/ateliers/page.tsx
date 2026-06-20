"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type React from "react";

interface Atelier {
  id: string;
  titre: string;
  theme: string;
  date: string;
  lieu: string;
  capacite: number;
  reservations: number;
}

const THEMES = ["Artisanat", "Peinture", "Bien-être", "Photographie", "Cuisine"];

const FORMULAIRE_VIDE = {
  titre: "",
  theme: THEMES[0],
  date: "",
  heure: "",
  lieu: "",
  capacite: "",
  description: "",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAteliersPage() {
  const router = useRouter();
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modeFormulaire, setModeFormulaire] = useState<"nouveau" | string | null>(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [sauvegarde, setSauvegarde] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ateliers").then(async (res) => {
      if (res.status === 403) { router.push("/connexion"); return; }
      setAteliers(await res.json());
      setChargement(false);
    });
  }, [router]);

  function ouvrirCreation() {
    setFormulaire(FORMULAIRE_VIDE);
    setErreur(null);
    setModeFormulaire("nouveau");
  }

  function ouvrirModification(atelier: Atelier) {
    const d = new Date(atelier.date);
    setFormulaire({
      titre: atelier.titre,
      theme: atelier.theme,
      date: d.toISOString().split("T")[0],
      heure: formatHeure(atelier.date),
      lieu: atelier.lieu,
      capacite: String(atelier.capacite),
      description: "",
    });
    setErreur(null);
    setModeFormulaire(atelier.id);
  }

  function fermerFormulaire() { setModeFormulaire(null); setErreur(null); }

  function handleChamp(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormulaire((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSoumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);

    if (!formulaire.titre || !formulaire.date || !formulaire.heure || !formulaire.lieu || !formulaire.capacite) {
      setErreur("Tous les champs obligatoires doivent être remplis.");
      return;
    }
    const capaciteNum = parseInt(formulaire.capacite, 10);
    if (isNaN(capaciteNum) || capaciteNum < 1) {
      setErreur("La capacité doit être un nombre entier positif.");
      return;
    }

    setSauvegarde(true);
    const isoDate = `${formulaire.date}T${formulaire.heure}:00.000Z`;
    const body = {
      titre: formulaire.titre,
      description: formulaire.description || formulaire.titre,
      theme: formulaire.theme,
      date: isoDate,
      lieu: formulaire.lieu,
      capacite: capaciteNum,
    };

    const res = await fetch(
      modeFormulaire === "nouveau" ? "/api/admin/ateliers" : `/api/admin/ateliers/${modeFormulaire}`,
      {
        method: modeFormulaire === "nouveau" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      setErreur(data.message ?? "Une erreur est survenue.");
      setSauvegarde(false);
      return;
    }

    const atelier = await res.json();

    if (modeFormulaire === "nouveau") {
      setAteliers((prev) => [{ ...atelier, reservations: 0 }, ...prev]);
    } else {
      setAteliers((prev) => prev.map((a) => a.id === modeFormulaire ? { ...a, ...atelier } : a));
    }

    setSauvegarde(false);
    fermerFormulaire();
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet atelier ? Cette action est irréversible.")) return;
    setSuppressionEnCours(id);
    await fetch(`/api/admin/ateliers/${id}`, { method: "DELETE" });
    setAteliers((prev) => prev.filter((a) => a.id !== id));
    setSuppressionEnCours(null);
  }

  if (chargement) {
    return <div className="py-16 text-center text-sm text-gray-400">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des ateliers</h1>
          <p className="mt-1 text-sm text-gray-500">{ateliers.length} atelier{ateliers.length !== 1 ? "s" : ""} au total</p>
        </div>
        <button onClick={ouvrirCreation} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
          + Nouvel atelier
        </button>
      </div>

      {/* Formulaire création / modification — même composant, deux modes */}
      {modeFormulaire !== null && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-gray-900">
            {modeFormulaire === "nouveau" ? "Créer un atelier" : "Modifier l'atelier"}
          </h2>
          <form onSubmit={handleSoumettre} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Titre <span className="text-red-500">*</span></label>
                <input name="titre" type="text" required value={formulaire.titre} onChange={handleChamp} placeholder="ex : Introduction à la poterie"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Thème</label>
                <select name="theme" value={formulaire.theme} onChange={handleChamp}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500">
                  {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Capacité <span className="text-red-500">*</span></label>
                <input name="capacite" type="number" min={1} required value={formulaire.capacite} onChange={handleChamp} placeholder="ex : 12"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
                <input name="date" type="date" required value={formulaire.date} onChange={handleChamp}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Heure <span className="text-red-500">*</span></label>
                <input name="heure" type="time" required value={formulaire.heure} onChange={handleChamp}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Lieu <span className="text-red-500">*</span></label>
                <input name="lieu" type="text" required value={formulaire.lieu} onChange={handleChamp} placeholder="ex : Salle B – Espace créatif"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" rows={3} value={formulaire.description} onChange={handleChamp} placeholder="Décrivez brièvement l'atelier…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" />
              </div>
            </div>
            {erreur && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={fermerFormulaire} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
                {sauvegarde ? "Enregistrement…" : modeFormulaire === "nouveau" ? "Créer" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {ateliers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">Aucun atelier. Créez-en un.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Atelier</th>
                <th className="hidden px-5 py-3 sm:table-cell">Date</th>
                <th className="hidden px-5 py-3 md:table-cell">Lieu</th>
                <th className="px-5 py-3 text-center">Places</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ateliers.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{a.titre}</p>
                    <span className="text-xs text-gray-400">{a.theme}</span>
                  </td>
                  <td className="hidden px-5 py-4 text-gray-600 sm:table-cell">
                    <p>{formatDate(a.date)}</p>
                    <p className="text-xs text-gray-400">{formatHeure(a.date)}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-gray-600 md:table-cell">{a.lieu}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`font-medium ${a.reservations >= a.capacite ? "text-red-600" : "text-gray-900"}`}>
                      {a.reservations}/{a.capacite}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => ouvrirModification(a)} className="text-xs font-medium text-gray-600 hover:underline">Modifier</button>
                      <button onClick={() => supprimer(a.id)} disabled={suppressionEnCours === a.id} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
                        {suppressionEnCours === a.id ? "…" : "Supprimer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
