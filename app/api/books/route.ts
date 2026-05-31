import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(books);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const data = await req.json();
  const status = data.status ?? "want_to_read";
  const totalPages = Number(data.totalPages);
  const book = await prisma.book.create({
    data: {
      title: data.title,
      author: data.author,
      genre: data.genre || null,
      totalPages,
      currentPage: status === "completed" ? totalPages : 0,
      yearStarted: data.yearStarted ? Number(data.yearStarted) : null,
      recommendedBy: data.recommendedBy || null,
      status,
      finishedAt: status === "completed" ? new Date() : null,
      userId: session.user.id,
    },
  });
  return NextResponse.json(book, { status: 201 });
}
