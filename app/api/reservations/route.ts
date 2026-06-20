import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivite } from "@/lib/logactivite";

const schema = z.object({
  atelierId: z.string().min(1),
});

// reserverPlace — la fonction métier centrale du projet (compétence CCP2)
export async function POST(req: NextRequest) {
  // 1. Vérifier que l'utilisateur est connecté
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }

  const { atelierId } = result.data;

  // 2. Vérifier que l'atelier existe et est dans le futur
  const atelier = await prisma.atelier.findUnique({ where: { id: atelierId } });
  if (!atelier) {
    return NextResponse.json({ message: "Atelier introuvable." }, { status: 404 });
  }
  if (atelier.date < new Date()) {
    return NextResponse.json({ message: "Cet atelier est déjà passé." }, { status: 400 });
  }

  // 3. Vérifier que l'utilisateur n'a pas déjà une réservation active
  const dejaReserve = await prisma.reservation.findUnique({
    where: { userId_atelierId: { userId: session.userId, atelierId } },
  });
  if (dejaReserve?.statut === "CONFIRMEE") {
    return NextResponse.json({ message: "Vous avez déjà réservé cet atelier." }, { status: 409 });
  }

  // 4. Vérifier la capacité — anti-overbooking
  // La vérification + l'insertion sont dans une transaction pour éviter
  // qu'une condition de course permette deux réservations simultanées
  const reservation = await prisma.$transaction(async (tx) => {
    const nbConfirmees = await tx.reservation.count({
      where: { atelierId, statut: "CONFIRMEE" },
    });

    if (nbConfirmees >= atelier.capacite) {
      throw new Error("COMPLET");
    }

    // Si l'utilisateur avait annulé, on réactive — sinon on crée
    return tx.reservation.upsert({
      where: { userId_atelierId: { userId: session.userId, atelierId } },
      create: { userId: session.userId, atelierId, statut: "CONFIRMEE" },
      update: { statut: "CONFIRMEE" },
    });
  });

  // Écriture dans MongoDB — compétence NoSQL
  await logActivite(
    "RESERVATION_CONFIRMEE",
    `Réservation pour « ${atelier.titre} »`,
    { userId: session.userId }
  );

  return NextResponse.json(
    { message: "Réservation confirmée.", reservationId: reservation.id },
    { status: 201 }
  );
}
