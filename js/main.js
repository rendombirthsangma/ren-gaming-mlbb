// ========================================
// REN GAMING - SUPABASE CONNECTION
// ========================================

const SUPABASE_URL =
    "https://bixpvxkpnaqdifmvkhvp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_XtzkrIFbBPTGUmoLHqHu5Q_XeznKoVI";

const REN_GAMING_URL =
    "https://rendombirthsangma.github.io/ren-gaming-mlbb/";

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
// GOOGLE LOGIN
// ========================================

async function signInWithGoogle() {
    try {
        const { data, error } =
            await supabaseClient.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: REN_GAMING_URL
                }
            });

        if (error) {
            console.error("Google sign-in error:", error);
            alert("Google login failed: " + error.message);
        }

    } catch (error) {
        console.error("Unexpected Google login error:", error);
        alert("Unable to start Google login. Please try again.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const googleButton =
        document.getElementById("google-login-btn");

    if (googleButton) {
        googleButton.addEventListener("click", function (event) {
            event.preventDefault();
            signInWithGoogle();
        });
    }
});


// ========================================
// HANDLE AUTHENTICATION SESSION
// ========================================

async function checkUserSession() {
    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            return null;
        }

        return data.session;

    } catch (error) {
        console.error("Unable to check session:", error);
        return null;
    }
}


// ========================================
// TOURNAMENT DISPLAY HELPERS
// ========================================

function showTournamentCard(show) {
    const card = document.getElementById("tournament-card");

    if (card) {
        card.hidden = !show;
    }

    const emptyMessage = document.getElementById("no-tournament");

    if (emptyMessage) {
        emptyMessage.hidden = show;
    }
}


function disableRegistration(message) {
    const button = document.getElementById("tournament-register");

    if (!button) return;

    button.textContent = message;
    button.removeAttribute("href");
    button.classList.add("registration-closed");
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("tabindex", "-1");
}


function enableRegistration(tournamentId) {
    const button = document.getElementById("tournament-register");

    if (!button) return;

    // Keep the existing registration page.
    // Pass the tournament ID in case the page supports it.
    button.href =
        "tournament-register.html?id=" +
        encodeURIComponent(tournamentId);

    button.textContent = "REGISTER NOW";
    button.classList.remove("registration-closed");
    button.removeAttribute("aria-disabled");
    button.removeAttribute("tabindex");
}


// ========================================
// LOAD TOURNAMENTS FROM SUPABASE
// ========================================

async function loadTournaments() {
    showTournamentCard(false);

    try {
        const { data, error } = await supabaseClient
            .from("tournament")
            .select("*");

        if (error) {
            throw error;
        }

        console.log("TOURNAMENT DATA:", data);

        const tournaments = Array.isArray(data) ? data : [];

        const now = new Date();

        // Hide completed or cancelled tournaments from
        // the featured tournament section.
        const availableTournaments = tournaments.filter(item => {
            const status = String(item.status || "upcoming")
                .trim()
                .toLowerCase();

            return status !== "completed" &&
                   status !== "cancelled";
        });

        if (availableTournaments.length === 0) {
            showTournamentCard(false);
            disableRegistration("NO TOURNAMENT AVAILABLE");
            console.log("No available tournaments to display.");
            return;
        }

        // Prefer ongoing tournaments. Otherwise show the
        // nearest upcoming tournament.
        availableTournaments.sort((a, b) => {
            const statusA = String(a.status || "upcoming").toLowerCase();
            const statusB = String(b.status || "upcoming").toLowerCase();

            if (statusA === "ongoing" && statusB !== "ongoing") {
                return -1;
            }

            if (statusB === "ongoing" && statusA !== "ongoing") {
                return 1;
            }

            const dateA = a.start_date
                ? new Date(a.start_date).getTime()
                : Number.MAX_SAFE_INTEGER;

            const dateB = b.start_date
                ? new Date(b.start_date).getTime()
                : Number.MAX_SAFE_INTEGER;

            return dateA - dateB;
        });

        // Choose the first available tournament.
        const tournament = availableTournaments[0];

        // Show the tournament card.
        showTournamentCard(true);

        // Name and game.
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

        // Team size.
        const teamSize = Number(tournament.team_size);

        setText(
            "tournament-size",
            Number.isFinite(teamSize) && teamSize > 0
                ? `${teamSize}v${teamSize}`
                : "5v5"
        );

        // Entry fee.
        const entryFee = Number(tournament.entry_fee);

        setText(
            "tournament-entry",
            tournament.entry_fee !== null &&
            tournament.entry_fee !== "" &&
            Number.isFinite(entryFee)
                ? entryFee === 0
                    ? "FREE"
                    : `₹${entryFee}`
                : "—"
        );

        // Prize.
        const prize = Number(tournament.prize);

        setText(
            "tournament-prize",
            tournament.prize !== null &&
            tournament.prize !== "" &&
            Number.isFinite(prize)
                ? `₹${prize.toLocaleString("en-IN")}`
                : "—"
        );

        // ========================================
        // REGISTRATION STATUS
        // ========================================

        const status = String(tournament.status || "upcoming")
            .trim()
            .toLowerCase();

        const registrationOpen =
            tournament.registration_open === true;

        const deadline = tournament.registration_deadline
            ? new Date(tournament.registration_deadline)
            : null;

        const deadlineValid =
            deadline && !Number.isNaN(deadline.getTime());

        const deadlinePassed =
            deadlineValid && deadline.getTime() < now.getTime();

        const statusElement =
            document.getElementById("tournament-status");

        if (statusElement) {
            statusElement.classList.remove(
                "registration-closed",
                "registration-open"
            );
        }

        // Completed or cancelled.
        if (status === "completed" || status === "cancelled") {
            setText(
                "tournament-status",
                status === "completed"
                    ? "● COMPLETED"
                    : "● CANCELLED"
            );

            disableRegistration(
                status === "completed"
                    ? "TOURNAMENT COMPLETED"
                    : "TOURNAMENT CANCELLED"
            );

            return;
        }

        // Registration closed by admin or deadline.
        if (!registrationOpen || deadlinePassed) {
            setText(
                "tournament-status",
                "● REGISTRATION CLOSED"
            );

            disableRegistration("REGISTRATION CLOSED");
            return;
        }

        // Registration open.
        if (status === "ongoing") {
            setText(
                "tournament-status",
                "● ONGOING — REGISTRATION OPEN"
            );
        } else {
            setText(
                "tournament-status",
                "● REGISTRATION OPEN"
            );
        }

        if (statusElement) {
            statusElement.classList.add("registration-open");
        }

        enableRegistration(tournament.id);

    } catch (error) {
        console.error("Tournament loading error:", error);

        showTournamentCard(false);
        disableRegistration("UNABLE TO LOAD TOURNAMENT");

        const emptyMessage = document.getElementById("no-tournament");

        if (emptyMessage) {
            emptyMessage.hidden = false;
            emptyMessage.innerHTML = `
                <h3>Unable to load tournaments</h3>
                <p>Please refresh the page and try again later.</p>
            `;
        }
    }
}


// ========================================
// START
// ========================================

document.addEventListener("DOMContentLoaded", function () {
    loadTournaments();
    checkUserSession();
});
