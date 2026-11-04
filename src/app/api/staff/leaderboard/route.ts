import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStaffLeaderboard } from "@/lib/points";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leaderboard = await getStaffLeaderboard();

    // Find current user's rank
    const myRank = leaderboard.find((entry) => entry.userId === user.id);

    return NextResponse.json({
      leaderboard,
      myStanding: myRank || null,
      totalParticipants: leaderboard.length,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to generate staff leaderboard" },
      { status: 500 }
    );
  }
}
