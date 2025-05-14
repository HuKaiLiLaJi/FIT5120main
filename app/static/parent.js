function fetchEntries() {
    const userId = document.getElementById('user-id').value.trim();
    const weekValue = document.getElementById('week-select').value;

    if (!userId || !weekValue) {
        alert('Please enter a valid User ID and select a week.');
        return;
    }

    // Extracting year and week
    const [year, week] = weekValue.split('-W');

    fetch(`/activity-entries?user_id=${userId}&year=${year}&week=${week-1}`)
        .then(res => res.json())
        .then(data => {
            const activityList = document.getElementById('activity-list');
            activityList.innerHTML = '';

            if (data.error) {
                activityList.innerHTML = `<p>${data.error}</p>`;
                return;
            }

            if (data.length === 0) {
                activityList.innerHTML = '<p>No activities found for this week.</p>';
                return;
            }

            const ul = document.createElement('ul');
            data.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = `${entry.activity_name} - Enjoyment: ${entry.enjoyment}, Amount: ${entry.amount}, Activeness: ${entry.activeness}`;
                ul.appendChild(li);
            });
            activityList.appendChild(ul);
        })
        .catch(err => {
            console.error(err);
            alert('Error fetching activities. Please try again.');
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

