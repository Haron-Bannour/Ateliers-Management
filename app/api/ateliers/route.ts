import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ateliers = await prisma.atelier.findMany({
    orderBy: { date: "asc" },
    include: {
      // On compte les réservations confirmées pour calculer les places restantes
      _count: { select: { reservations: { where: { statut: "CONFIRMEE" } } } },
    },
  });

  const data = ateliers.map((a) => ({
    id: a.id,
    titre: a.titre,
    description: a.description,
    theme: a.theme,
    date: a.date,
    lieu: a.lieu,
    capacite: a.capacite,
    reservations: a._count.reservations,
  }));

  return NextResponse.json(data);
}
