import Link from "next/link";
import RoomView from "@/components/RoomView";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main className="min-h-dvh p-6 flex flex-col items-center pt-12">
      <RoomView code={code.toUpperCase()} />
      <Link
        href="/"
        className="mt-8 text-sm text-gray-600 hover:text-gray-400 transition-colors"
      >
        &larr; Back to Lobby
      </Link>
    </main>
  );
}
