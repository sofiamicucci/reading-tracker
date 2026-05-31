import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractMentions } from "@/lib/mentions";

async function getBookForUser(id: number, userId: string) {
  return prisma.book.findFirst({ where: { id, userId } });
}

async function notifyMentions(
  mentionerUserId: string,
  mentionerName: string | null,
  bookTitle: string,
  newNotes: string | undefined,
  newRecommendedBy: string | undefined,
  oldNotes: string | null,
  oldRecommendedBy: string | null
) {
  const prevMentions = extractMentions(oldNotes, oldRecommendedBy);
  const newMentions = extractMentions(newNotes, newRecommendedBy);
  const added = newMentions.filter((u) => !prevMentions.includes(u));
  if (!added.length) return;

  const users = await prisma.user.findMany({
    where: { username: { in: added }, NOT: { id: mentionerUserId } },
    select: { id: true, username: true },
  });

  if (!users.length) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "mention",
      message: `${mentionerName || "Alguém"} mencionou você nas notas do livro "${bookTitle}".`,
    })),
  });
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
  if (data.recommendedBy !== undefined) updateData.recommendedBy = data.recommendedBy || null;

  if (data.status === "reading" && !book.startedAt) updateData.startedAt = new Date();
  if (data.status === "completed") {
    updateData.finishedAt = new Date();
    updateData.currentPage = book.totalPages;
  }

  const [updated, me] = await Promise.all([
    prisma.book.update({ where: { id: Number(id) }, data: updateData }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ]);

  // Notificar menções novas (não aguarda para não atrasar a resposta)
  notifyMentions(
    session.user.id,
    me?.name ?? null,
    book.title,
    data.notes,
    data.recommendedBy,
    book.notes,
    book.recommendedBy,
  ).catch(() => {});

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
