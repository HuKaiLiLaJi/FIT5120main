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
  
    // 2) Fetch and render AI-generated summary
    fetch(`/generate-summary?user_id=${encodeURIComponent(userId)}&year=${encodeURIComponent(year)}&week=${encodeURIComponent(week)}`)
      .then(res => {
        if (!res.ok) throw new Error("Summary generation failed");
        return res.json();
      })
      .then(data => {
        document.getElementById("summary").innerHTML = `<div class="alert alert-light">${data.summary}</div>`;
      })
      .catch(err => {
        console.error(err);
        document.getElementById("summary").innerHTML = "<p class='text-danger'>Error generating summary.</p>";
      });
  }
  
  // Optional cancel function if you have a cancel button
  function cancelParentInputs() {
    document.getElementById("parent-popup").style.display = "none";
  }
  
  // ---------------------------------------------------
  // EXISTING FUNCTIONS (keep any others you need below)
  // ---------------------------------------------------
  