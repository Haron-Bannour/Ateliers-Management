import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
const COOKIE = "reserva_token";

export interface SessionPayload {
  userId: string;
  role: "MEMBRE" | "ADMIN";
}

// Crée un JWT signé et le pose dans un cookie httpOnly
export async function creerSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,   // inaccessible depuis JS côté client — protection XSS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",  // protection CSRF
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: "/",
  });
}

// Lit et vérifie le JWT depuis le cookie
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Supprime le cookie de session
export async function supprimerSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
