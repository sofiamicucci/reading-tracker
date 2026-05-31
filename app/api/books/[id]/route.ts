import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getBookForUser(id: number, userId: string) {
  return prisma.book.findFirst({ where: { id, userId } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const book = await getBookForUser(Number(id), session.user.id);
  if (!book) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const data = await req.json();
  const updateData: Record<string, unknown> = {};

  if (data.currentPage !== undefined) updateData.currentPage = Number(data.currentPage);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.rating !== undefined) updateData.rating = data.rating ? Number(data.rating) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.genre !== undefined) updateData.genre = data.genre;
  if (data.totalPages !== undefined) updateData.totalPages = Number(data.totalPages);
  if (data.yearStarted !== undefined) updateData.yearStarted = data.yearStarted ? Number(data.yearStarted) : null;

  if (data.status === "reading" && !book.startedAt) updateData.startedAt = new Date();
  if (data.status === "completed") {
    updateData.finishedAt = new Date();
    updateData.currentPage = book.totalPages;
  }

  const updated = await prisma.book.update({ where: { id: Number(id) }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const book = await getBookForUser(Number(id), session.user.id);
  if (!book) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  await prisma.book.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
