import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivite } from "@/lib/logactivite";

const schema = z.object({
  titre: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  theme: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  lieu: z.string().min(2).optional(),
  capacite: z.number().int().min(1).optional(),
});

async function verifierAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }

  const data = {
    ...result.data,
    ...(result.data.date ? { date: new Date(result.data.date) } : {}),
  };

  const atelier = await prisma.atelier.update({ where: { id }, data });

  await logActivite("ATELIER_MODIFIE", `Atelier modifié : « ${atelier.titre} »`);

  return NextResponse.json(atelier);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;

  // Supprime d'abord les réservations liées (contrainte FK)
  await prisma.reservation.deleteMany({ where: { atelierId: id } });
  const atelier = await prisma.atelier.delete({ where: { id } });

  await logActivite("ATELIER_SUPPRIME", `Atelier supprimé : « ${atelier.titre} »`);

  return NextResponse.json({ message: "Atelier supprimé." });
}
