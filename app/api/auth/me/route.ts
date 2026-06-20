import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Utilisé par le frontend pour savoir qui est connecté (le cookie JWT est httpOnly)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, nom: true, email: true, role: true },
  });

  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json(user);
}
