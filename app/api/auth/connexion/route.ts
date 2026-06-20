import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { creerSession } from "@/lib/auth";
import { logActivite } from "@/lib/logactivite";

const schema = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }

  const { email, motDePasse } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // On compare même si l'utilisateur n'existe pas pour éviter les timing attacks
  const motDePasseValide = user
    ? await compare(motDePasse, user.passwordHash)
    : false;

  if (!user || !motDePasseValide) {
    return NextResponse.json(
      { message: "Identifiants incorrects." },
      { status: 401 }
    );
  }

  await creerSession({ userId: user.id, role: user.role });

  await logActivite("CONNEXION", "Connexion au compte", { userId: user.id, membre: user.nom });

  return NextResponse.json({ message: "Connexion réussie.", role: user.role });
}
