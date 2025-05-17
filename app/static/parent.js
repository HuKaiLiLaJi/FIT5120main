function confirmParentInputs() {
    const userId = document.getElementById("popup-user-id").value.trim();
    const week = document.getElementById("popup-week").value;

    if (!userId || !week) {
        alert("Please fill in both user ID and week.");
        return;
    }

    document.getElementById("user-id").value = userId;
    document.getElementById("week-select").value = week;
    document.getElementById("parent-popup").remove();

    fetchEntries();
}

function cancelParentPopup() {
    document.getElementById("parent-popup").remove();
}

function fetchEntries() {
    const userId = document.getElementById("user-id").value.trim();
    const week = document.getElementById("week-select").value;

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

            entries.forEach(entry => {
                const container = document.getElementById("activity-list");
                container.innerHTML = ""; // Clear previous results
                
                if (!entries.length) {
                    container.innerHTML = "<p>No entries for this week.</p>";
                    return;
                }
                
                // Create a grid wrapper
                const grid = document.createElement("div");
                grid.className = "activity-grid";
                container.appendChild(grid);
                
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
                
            });
        })
        .catch(err => {
            alert("Failed to load activity data.");
            console.error(err);
        });
}



function generateSummary() {
    const userId = document.getElementById('user-id').value.trim();
    const weekValue = document.getElementById('week-select').value;

    if (!userId || !weekValue) {
        alert('Please enter a valid User ID and select a week.');
        return;
    }

    // Extracting year and week
    const [year, week] = weekValue.split('-W');

    fetch(`/generate-summary?user_id=${userId}&year=${year}&week=${week-1}`)
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

