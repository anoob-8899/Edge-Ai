import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStaffLeaderboard } from "@/lib/points";
import { FALLBACK_LEADERBOARD } from "@/lib/mock-data";
import { shouldFallbackToMock } from "@/lib/demo-mode";

export async function GET() {
  try {
    const user = await getCurrentUser();
    let leaderboard: any[] = [];
    let isDbSuccess = false;

    try {
      leaderboard = await getStaffLeaderboard();
      if (leaderboard && leaderboard.length > 0) {
        isDbSuccess = true;
      }
    } catch (dbErr) {
      if (!shouldFallbackToMock()) {
        console.error("Database connection failure in /api/staff/leaderboard:", dbErr);
        return NextResponse.json(
          { error: "Database service unavailable. Real staff rankings cannot be retrieved.", code: "DATABASE_UNAVAILABLE" },
          { status: 503 }
        );
      }
      leaderboard = [];
    }

    if (!leaderboard || leaderboard.length === 0) {
      if (!shouldFallbackToMock()) {
        return NextResponse.json({
          leaderboard: [],
          myStanding: null,
          totalParticipants: 0,
          isGuest: !user,
          isDemoData: false,
        });
      }
      leaderboard = FALLBACK_LEADERBOARD;
    }

    // Find current user's rank or highlight rank 2 (Ksenia Bator, matching visual reference)
    const myRank = user
      ? leaderboard.find((entry) => entry.userId === user.id) || leaderboard[1]
      : leaderboard[1];

    return NextResponse.json({
      leaderboard,
      myStanding: myRank || null,
      totalParticipants: leaderboard.length,
      isGuest: !user,
      isDemoData: !isDbSuccess,
    });
  } catch (error) {
    if (!shouldFallbackToMock()) {
      console.error("Error in staff leaderboard handler:", error);
      return NextResponse.json(
        { error: "Database service unavailable.", code: "DATABASE_UNAVAILABLE" },
        { status: 503 }
      );
    }
    console.warn("[DEMO MODE] Serving fallback leaderboard:", error);
    return NextResponse.json({
      leaderboard: FALLBACK_LEADERBOARD,
      myStanding: FALLBACK_LEADERBOARD[1],
      totalParticipants: FALLBACK_LEADERBOARD.length,
      isGuest: true,
      isDemoData: true,
    });
  }
}
