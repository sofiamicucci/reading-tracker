"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function BackToLibrary() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return (
    <Link href="/" className="inline-flex items-center gap-1 text-indigo-600 text-sm hover:underline mb-6">
      ← Minhas Leituras
    </Link>
  );
}
