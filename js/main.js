// ========================================
// REN GAMING - SUPABASE CONNECTION
// ========================================

const SUPABASE_URL =
    "https://bixpvxkpnaqdifmvkhvp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_XtzkrIFbBPTGUmoLHqHu5Q_XeznKoVI";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Ren Gaming website loaded.");
console.log("Supabase client initialized:", !!supabaseClient);


// ========================================
// SAFE PAGE UPDATES
// ========================================

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ========================================
// LOAD TOURNAMENTS
// ========================================

async function loadTournaments() {
    try {
        const { data, error } = await supabaseClient
            .from("tournament")
            .select("*")
            .order("start_date", { ascending: true });

        if (error) {
            console.error("Tournament loading error:", error);

            setText(
                "tournament-name",
                "Unable to load tournaments"
            );

            setText(
                "tournament-title",
                "Please try again later"
            );

            setText(
                "tournament-description",
                "We couldn't load tournament information. Please try again soon."
            );

            return;
        }

        console.log("TOURNAMENT DATA:", data);

        if (!data || data.length === 0) {
            setText("tournament-name", "No Upcoming Tournament");
            setText("tournament-title", "No tournament available");
            setText(
                "tournament-game",
                "MOBA LEGENDS: 5v5!"
            );
            setText(
                "tournament-description",
                "Check back soon for upcoming Ren Gaming tournaments."
            );
            setText("tournament-size", "5v5");
            setText("tournament-entry", "—");
            setText("tournament-prize", "—");
            setText("tournament-status", "No tournaments available");
            return;
        }

        // Find the next tournament that has not ended.
        // This does not assume that registration is open.
        const now = new Date();

        const tournament = data.find(item => {
            if (!item.start_date) return true;

            const startDate = new Date(item.start_date);

            return !Number.isNaN(startDate.getTime()) &&
                startDate >= now;
        }) || data[0];

        setText(
            "tournament-name",
            tournament.name || "Ren Gaming Tournament"
        );

        setText(
            "tournament-game",
            tournament.game || "MOBA LEGENDS: 5v5!"
        );

        setText(
            "tournament-title",
            tournament.name || "Ren Gaming Tournament"
        );

        setText(
            "tournament-description",
            tournament.description ||
                "Join the Ren Gaming tournament and compete against other teams."
        );

        setText(
            "tournament-size",
            tournament.team_size
                ? `${tournament.team_size}v${tournament.team_size}`
                : "5v5"
        );

        const entryFee = Number(tournament.entry_fee);

        setText(
            "tournament-entry",
            Number.isFinite(entryFee)
                ? entryFee === 0
                    ? "FREE"
                    : `₹${entryFee}`
                : "—"
        );

        const prize = Number(tournament.prize);

        setText(
            "tournament-prize",
            Number.isFinite(prize) ? `₹${prize}` : "—"
        );

        // Determine registration status conservatively.
        const status = String(tournament.status || "unknown")
            .toLowerCase();

        const registrationOpen =
            tournament.registration_open === true;

        const deadline = tournament.registration_deadline
            ? new Date(tournament.registration_deadline)
            : null;

        const deadlineValid =
            deadline && !Number.isNaN(deadline.getTime());

        let statusText = status.toUpperCase();

        if (status === "completed" || status === "cancelled") {
            statusText = status.toUpperCase();
        } else if (
            !registrationOpen ||
            (deadlineValid && deadline < now)
        ) {
            statusText = "REGISTRATION CLOSED";
        } else if (status === "upcoming") {
            statusText = "REGISTRATION OPEN";
        }

        setText("tournament-status", `● ${statusText}`);

    } catch (error) {
        console.error("Unexpected tournament error:", error);

        setText(
            "tournament-description",
            "Something went wrong while loading tournaments. Please try again later."
        );
    }
}


// ========================================
// START
// ========================================

loadTournaments();