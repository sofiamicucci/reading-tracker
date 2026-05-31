import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();

  const updateData: Record<string, unknown> = {};

  if (data.currentPage !== undefined) {
    updateData.currentPage = Number(data.currentPage);
  }
  if (data.status !== undefined) updateData.status = data.status;
  if (data.rating !== undefined)
    updateData.rating = data.rating ? Number(data.rating) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.genre !== undefined) updateData.genre = data.genre;
  if (data.totalPages !== undefined)
    updateData.totalPages = Number(data.totalPages);
  if (data.yearStarted !== undefined)
    updateData.yearStarted = data.yearStarted ? Number(data.yearStarted) : null;

  if (data.status === "reading" && !data.startedAt) {
    updateData.startedAt = new Date();
  }
  if (data.status === "completed") {
    updateData.finishedAt = new Date();
    const book = await prisma.book.findUnique({ where: { id: Number(id) } });
    if (book) updateData.currentPage = book.totalPages;
  }

  const book = await prisma.book.update({
    where: { id: Number(id) },
    data: updateData,
  });
  return NextResponse.json(book);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.book.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
