import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      atelier: {
        select: { id: true, titre: true, theme: true, date: true, lieu: true },
      },
    },
  });

  return NextResponse.json(reservations);
}
