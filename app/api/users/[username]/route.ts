import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      createdAt: true,
      books: {
        where: {
          OR: [
            { rating: { not: null } },
            { notes: { not: null } },
          ],
        },
        select: {
          id: true,
          title: true,
          author: true,
          genre: true,
          totalPages: true,
          currentPage: true,
          status: true,
          rating: true,
          notes: true,
          yearStarted: true,
          coverUrl: true,
          finishedAt: true,
        },
        orderBy: { finishedAt: "desc" },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  return NextResponse.json(user);
}
