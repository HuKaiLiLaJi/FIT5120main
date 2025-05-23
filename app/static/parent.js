// ---------------------------------------------------
// HANDLE MODAL POPUP CONFIRMATION & CANCEL
// ---------------------------------------------------

function confirmParentInputs() {
    const userId = document.getElementById("popup-user-id").value.trim();
  
    // Determine which picker is visible
    let weekValue;
    const nativePicker = document.querySelector(".nativeWeekPicker");
    if (window.getComputedStyle(nativePicker).display !== "none") {
      weekValue = document.getElementById("popup-week").value;
    } else {
      const wk = document.getElementById("fallbackWeek").value;
      const yr = document.getElementById("fallbackYear").value;
      weekValue = `${yr}-W${wk}`;
    }
  
    if (!userId || !weekValue) {
      alert("Please fill in both user ID and week.");
      return;
    }
  
    // Hide the modal popup
    document.getElementById("parent-popup").style.display = "none";
  
    // Update hidden fields
    document.getElementById("user-id").value = userId;
    document.getElementById("week-select").value = weekValue;
  
    // Parse year and week
    const [year, week] = weekValue.split("-W");
  
    // 1) Fetch and render activity entries in grid/cards
    fetch(`/activity-entries?user_id=${encodeURIComponent(userId)}&year=${encodeURIComponent(year)}&week=${encodeURIComponent(week)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load activities");
        return res.json();
      })
      .then(entries => {
        const container = document.getElementById("activity-list");
        container.innerHTML = "";
  
        if (!entries.length) {
          container.innerHTML = "<p>No activities found for that week.</p>";
          return;
        }
  
        // create the grid wrapper
        const grid = document.createElement("div");
        grid.className = "activity-grid";
  
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
  
        container.appendChild(grid);
      })
      .catch(err => {
        console.error(err);
        document.getElementById("activity-list").innerHTML = "<p class='text-danger'>Error loading activities.</p>";
      });
  }
  
  // ---------------------------------------------------
  // MANUAL SUMMARY BUTTON HANDLER (ONLY BY CLICK)
  // ---------------------------------------------------
  
  function generateSummary() {
    const userId = document.getElementById("user-id").value.trim();
    const weekValue = document.getElementById("week-select").value;
  
    if (!userId || !weekValue) {
      alert("Please enter a valid User ID and select a week.");
      return;
    }
  
    const [year, week] = weekValue.split("-W");
    const summaryBox = document.getElementById("summary");
    summaryBox.innerHTML = '<div class="alert alert-secondary"><em>⏳ Generating summary...</em></div>';
  
    fetch(`/generate-summary?user_id=${encodeURIComponent(userId)}&year=${encodeURIComponent(year)}&week=${encodeURIComponent(week)}`)
      .then(res => {
        if (!res.ok) throw new Error("Summary generation failed");
        return res.json();
      })
      .then(data => {
        const markdown = data.summary || "No summary available.";
        summaryBox.innerHTML = `
          <div class="alert alert-info">
            <h5>Weekly Summary</h5>
            ${marked.parse(markdown)}
          </div>
        `;
      })
      .catch(err => {
        console.error(err);
        summaryBox.innerHTML = "<div class='alert alert-danger'>❌ Error generating summary.</div>";
      });
  }
  
  // ---------------------------------------------------
  // OPTIONAL CANCEL BUTTON
  // ---------------------------------------------------
  
  function cancelParentInputs() {
    document.getElementById("parent-popup").style.display = "none";
  }
  