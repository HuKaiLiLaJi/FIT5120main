// --------------------------------------------
// CONFIRM USER ID FROM POPUP
// --------------------------------------------
function confirmUserId() {
    const input = document.getElementById("popup-user-id").value.trim();

    // Validate input
    if (!input || isNaN(input)) {
        alert("Please enter a valid user ID.");
        return;
    }

    // Set the user ID in the main input and remove the popup
    document.getElementById("user-id").value = input;
    document.getElementById("user-id-popup").remove();
}


// --------------------------------------------
// DRAG & DROP FUNCTIONALITY
// --------------------------------------------

// Called when drag starts: stores the activity name and marks element
function drag(ev) {
    const nameOnly = ev.target.querySelector('.activity-name')?.textContent.trim() || '';
    ev.dataTransfer.setData("activity_name", nameOnly);
    ev.target.classList.add("dragging");
    ev.target.setAttribute("data-original-x", ev.clientX);
    ev.target.setAttribute("data-original-y", ev.clientY);
}

// Called when drag ends: removes styles and resets if not dropped
function dragEnd(ev) {
    ev.target.classList.remove("dragging");

    const wasDropped = ev.dataTransfer.dropEffect === "move";
    if (!wasDropped) {
        ev.target.classList.add("return-animation");
        setTimeout(() => ev.target.classList.remove("return-animation"), 300);
    }
}

// Allow drop into a valid container
function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add("dragover");
}

// Called when activity is dropped into dropzone
function drop(ev) {
    ev.preventDefault();

    const userId = document.getElementById("user-id").value.trim();
    if (!userId) {
        alert("Please enter a valid user ID before dropping the activity.");
        return;
    }

    const activityName = ev.dataTransfer.getData("activity_name");

    // Modal for reflection inputs
    const modal = document.createElement('div');
    modal.classList.add('popup-overlay');
    modal.innerHTML = `
        <div class="popup-box">
            <h3>🎯 Reflect on <span style="color:#007bff">${activityName}</span></h3>
            <label>How much did you do?</label>
            <select id="amount">
                <option value="1">A little</option>
                <option value="2">Some</option>
                <option value="3">A lot</option>
            </select>
            <label>Did you enjoy it?</label>
            <select id="enjoyment">
                <option value="1">🙁 Not really</option>
                <option value="2">😐 Kind of</option>
                <option value="3">😊 Yes</option>
            </select>
            <label>Was it engaging?</label>
            <select id="activeness">
                <option value="1">😴 Passive</option>
                <option value="2">🧠 Used my brain</option>
                <option value="3">💪 Moved my body</option>
            </select>
            <div style="text-align:center;margin-top:10px">
                <button id="confirmEntry">✅ Save</button>
                <button id="cancelEntry">❌ Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Save button action
    document.getElementById("confirmEntry").onclick = () => {
        const enjoyment = document.getElementById("enjoyment").value;
        const amount = document.getElementById("amount").value;
        const activeness = document.getElementById("activeness").value;

        // Remove modal
        document.body.removeChild(modal);

        // Send data to backend
        fetch("/activity-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: parseInt(userId),
                activity_name: activityName,
                enjoyment: parseInt(enjoyment),
                amount: parseInt(amount),
                activeness: parseInt(activeness)
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                const doneContainer = document.getElementById("done-this-week");
                const activityDiv = document.createElement("div");
                activityDiv.classList.add("done-activity");
                activityDiv.innerHTML = `
                    <strong>${activityName}</strong><br>
                    Enjoyment: ${enjoyment} / 3<br>
                    Amount: ${amount} / 3<br>
                    Activeness: ${activeness} / 3
                `;
                doneContainer.appendChild(activityDiv);
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(err => {
            console.error("Error adding activity entry:", err);
            alert("Failed to add the activity entry. Please try again later.");
        });
    };

    // Cancel button action
    document.getElementById("cancelEntry").onclick = () => {
        document.body.removeChild(modal);
    };
}


// --------------------------------------------
// ACTIVITY MANAGEMENT
// --------------------------------------------

// Fetch and display activities from server
function loadActivities() {
    fetch("/activities")
        .then(res => res.json())
        .then(data => {
            const activitiesContainer = document.getElementById("activities");
            activitiesContainer.innerHTML = ''; // Clear previous

            const colorClasses = ['color1', 'color2', 'color3', 'color4', 'color5'];
            data.forEach(activity => {
                const div = document.createElement("div");
                div.classList.add("activity", colorClasses[Math.floor(Math.random() * colorClasses.length)]);
                div.setAttribute("draggable", "true");
                div.innerHTML = `
                <span class="activity-name">${activity.name}</span>
                <span class="delete-icon" title="Remove">❌</span>
              `;
                div.ondragstart = drag;
                div.ondragend = dragEnd;
                activitiesContainer.appendChild(div);
                div.querySelector('.delete-icon').addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent drag conflict
                    if (confirm(`Delete "${activity.name}"?`)) {
                      deleteActivity(activity.id);
                    }
                  });
                  
            });
        })
        .catch(err => {
            console.error("Error loading activities:", err);
            alert("Failed to load activities. Please try again later.");
        });
}

// Add a new activity to server
function addActivity() {
    const name = document.getElementById("activity-name").value.trim();

    if (name) {
        fetch("/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadActivities();
        })
        .catch(err => {
            console.error("Error adding activity:", err);
            alert("Failed to add activity. Please try again later.");
        });
    }
}

// Delete an activity by ID
function deleteActivity(id) {
    fetch(`/activities?id=${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadActivities();
        })
        .catch(err => {
            console.error("Error deleting activity:", err);
            alert("Failed to delete activity. Please try again later.");
        });
}


// --------------------------------------------
// INITIALIZE WHEN PAGE LOADS
// --------------------------------------------
document.addEventListener("DOMContentLoaded", loadActivities);