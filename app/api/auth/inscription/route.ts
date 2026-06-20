import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { creerSession } from "@/lib/auth";

// Validation côté serveur — on ne fait jamais confiance au client
const schema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  motDePasse: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 }
    );
  }

  const { nom, email, motDePasse } = result.data;

  const existant = await prisma.user.findUnique({ where: { email } });
  if (existant) {
    return NextResponse.json(
      { message: "Cette adresse e-mail est déjà utilisée." },
      { status: 409 }
    );
  }

  // bcrypt avec un coût de 12 — suffisamment lent pour résister aux attaques bruteforce
  const passwordHash = await hash(motDePasse, 12);

  const user = await prisma.user.create({
    data: { nom, email, passwordHash },
  });

  await creerSession({ userId: user.id, role: user.role });

  return NextResponse.json({ message: "Compte créé." }, { status: 201 });
}
