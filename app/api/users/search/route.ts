import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (!q) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q },
      NOT: { username: null },
    },
    select: { username: true, name: true },
    take: 5,
  });

  return NextResponse.json(users);
}
