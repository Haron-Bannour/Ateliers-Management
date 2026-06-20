import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const reservations = await prisma.reservation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, nom: true, email: true } },
      atelier: { select: { id: true, titre: true, date: true, capacite: true } },
    },
  });

  return NextResponse.json(reservations);
}
