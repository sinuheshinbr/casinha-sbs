import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { joinTrip } from "@/app/actions-split";

export const dynamic = "force-dynamic";

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    const callbackUrl = encodeURIComponent(`/split/join/${tripId}`);
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  const r = await joinTrip(tripId);
  if (r.error) {
    redirect("/split");
  }

  redirect(`/split?t=${tripId}`);
}
