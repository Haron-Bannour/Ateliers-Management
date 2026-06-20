import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivite } from "@/lib/logactivite";

const schema = z.object({
  titre: z.string().min(2),
  description: z.string().min(5),
  theme: z.string().min(1),
  date: z.string().datetime(),
  lieu: z.string().min(2),
  capacite: z.number().int().min(1),
});

// Vérifie que la requête vient d'un admin
async function verifierAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const ateliers = await prisma.atelier.findMany({
    orderBy: { date: "asc" },
    include: {
      _count: { select: { reservations: { where: { statut: "CONFIRMEE" } } } },
    },
  });

  return NextResponse.json(
    ateliers.map((a) => ({ ...a, reservations: a._count.reservations, _count: undefined }))
  );
}

export async function POST(req: NextRequest) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ message: "Données invalides.", erreurs: result.error.flatten() }, { status: 400 });
  }

  const atelier = await prisma.atelier.create({
    data: { ...result.data, date: new Date(result.data.date) },
  });

  await logActivite("ATELIER_CREE", `Nouvel atelier créé : « ${atelier.titre} »`);

  return NextResponse.json(atelier, { status: 201 });
}
