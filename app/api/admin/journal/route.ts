import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connecterMongo } from "@/lib/mongodb";
import { ActivityLog } from "@/lib/models/activitelog";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action"); // filtre optionnel

  await connecterMongo();

  const filtre = action && action !== "TOUS" ? { action } : {};

  const entrees = await ActivityLog.find(filtre)
    .sort({ createdAt: -1 }) // les plus récents en premier
    .limit(100)              // on limite à 100 pour l'affichage
    .lean();                 // retourne des objets JS simples, plus rapide

  return NextResponse.json(entrees);
}
