import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const atelier = await prisma.atelier.findUnique({
    where: { id },
    include: {
      _count: { select: { reservations: { where: { statut: "CONFIRMEE" } } } },
    },
  });

  if (!atelier) {
    return NextResponse.json({ message: "Atelier introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    id: atelier.id,
    titre: atelier.titre,
    description: atelier.description,
    theme: atelier.theme,
    date: atelier.date,
    lieu: atelier.lieu,
    capacite: atelier.capacite,
    reservations: atelier._count.reservations,
  });
}
