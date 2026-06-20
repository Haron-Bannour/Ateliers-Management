import { NextResponse } from "next/server";
import { supprimerSession } from "@/lib/auth";

export async function POST() {
  await supprimerSession();
  return NextResponse.json({ message: "Déconnexion réussie." });
}
