// ---------------------------------------------------
// HANDLE MODAL POPUP CONFIRMATION & CANCEL
// ---------------------------------------------------

/**
 * Called when user confirms the popup form with user ID and week.
 * Updates the main input fields and fetches entries for that week.
 */
function confirmParentInputs() {
    const userId = document.getElementById("popup-user-id").value.trim();
    const week = document.getElementById("popup-week").value;

    if (!userId || !week) {
        alert("Please fill in both user ID and week.");
        return;
    }

    // Set values in main form
    document.getElementById("user-id").value = userId;
    document.getElementById("week-select").value = week;

    // Close the popup
    document.getElementById("parent-popup").remove();

    // Trigger data load
    fetchEntries();
}

/**
 * Cancel the popup without saving input
 */
function cancelParentPopup() {
    document.getElementById("parent-popup").remove();
}

// ---------------------------------------------------
// FETCH AND DISPLAY WEEKLY ACTIVITY ENTRIES
// ---------------------------------------------------

/**
 * Fetch activity entries from server and render them in a grid
 */
function fetchEntries() {
    const userId = document.getElementById("user-id").value.trim();
    const week = document.getElementById("week-select").value;

    // Parse ISO week format (e.g., "2025-W20")
    const [year, weekNum] = week.split("-W");

    fetch(`/activity-entries?user_id=${userId}&year=${year}&week=${weekNum}`)
        .then(res => res.json())
        .then(entries => {
            const container = document.getElementById("activity-list");
            container.innerHTML = "";

            if (!entries.length) {
                container.innerHTML = "<p>No entries for this week.</p>";
                return;
            }

            // Create a grid layout
            const grid = document.createElement("div");
            grid.className = "activity-grid";
            container.appendChild(grid);

            // Create a card for each entry
            entries.forEach(entry => {
                const card = document.createElement("div");
                card.classList.add("activity-card");

                card.innerHTML = `
                    <div class="activity-name">${entry.activity_name}</div>
                    <div class="activity-detail">😊 Enjoyment: ${entry.enjoyment}/3</div>
                    <div class="activity-detail">⏱ Amount: ${entry.amount}/3</div>
                    <div class="activity-detail">⚡ Activeness: ${entry.activeness}/3</div>
                    <div class="activity-detail small text-muted">${entry.timestamp}</div>
                `;

                grid.appendChild(card);
            });
        })
        .catch(err => {
            alert("Failed to load activity data.");
            console.error(err);
        });
}

// ---------------------------------------------------
// GENERATE SUMMARY BASED ON WEEKLY DATA
// ---------------------------------------------------

/**
 * Calls the backend to generate a weekly summary using AI
 */
function generateSummary() {
    const userId = document.getElementById('user-id').value.trim();
    const weekValue = document.getElementById('week-select').value;

    if (!userId || !weekValue) {
        alert('Please enter a valid User ID and select a week.');
        return;
    }

    const [year, week] = weekValue.split('-W');

    // Backend expects week starting from 0 (adjust as needed)
    fetch(`/generate-summary?user_id=${userId}&year=${year}&week=${week}`)
        .then(res => res.json())
        .then(data => {
            const summaryDiv = document.getElementById('summary');
            summaryDiv.innerHTML = `<p>${data.summary}</p>`;
        })
        .catch(err => {
            console.error(err);
            alert('Error generating summary. Please try again.');
        });
}