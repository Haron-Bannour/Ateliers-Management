import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivite } from "@/lib/logactivite";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation) {
    return NextResponse.json({ message: "Réservation introuvable." }, { status: 404 });
  }

  // Un membre ne peut annuler que ses propres réservations
  if (reservation.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ message: "Action non autorisée." }, { status: 403 });
  }

  if (reservation.statut === "ANNULEE") {
    return NextResponse.json({ message: "Réservation déjà annulée." }, { status: 400 });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { statut: "ANNULEE" },
    include: { atelier: { select: { titre: true } }, user: { select: { nom: true } } },
  });

  await logActivite(
    "RESERVATION_ANNULEE",
    `Annulation de réservation pour « ${updated.atelier.titre} »`,
    { userId: session.userId, membre: updated.user.nom }
  );

  return NextResponse.json({ message: "Réservation annulée." });
}
