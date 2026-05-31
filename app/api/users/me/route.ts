import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { username } = await req.json();

  if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json(
      { error: "Username inválido. Use letras minúsculas, números e _ (3-30 caracteres)." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: { username: true, name: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Username já está em uso." }, { status: 409 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, name: true, email: true },
  });

  return NextResponse.json(user);
}
