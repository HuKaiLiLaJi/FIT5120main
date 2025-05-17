function confirmUserId() {
    const input = document.getElementById("popup-user-id").value.trim();
    if (!input || isNaN(input)) {
        alert("Please enter a valid numeric user ID.");
        return;
    }
    document.getElementById("user-id").value = input;
    document.getElementById("user-id-popup").remove();
}

function drag(ev) {
    ev.dataTransfer.setData("activity_name", ev.target.textContent.trim());
    ev.target.classList.add("dragging");
    ev.target.setAttribute("data-original-x", ev.clientX);
    ev.target.setAttribute("data-original-y", ev.clientY);
}

function dragEnd(ev) {
    ev.target.classList.remove("dragging");

    // Check if dropped into a valid dropzone
    const wasDropped = ev.dataTransfer.dropEffect === "move";
    if (!wasDropped) {
        // Animate back to original style
        ev.target.classList.add("return-animation");
        setTimeout(() => ev.target.classList.remove("return-animation"), 300);
    }
}

function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add("dragover");
}

function drop(ev) {
    ev.preventDefault();
    const userId = document.getElementById("user-id").value.trim();
    if (!userId) {
        alert("Please enter a valid user ID before dropping the activity.");
        return;
    }

    const activityName = ev.dataTransfer.getData("activity_name");

    // Create a modal (overlay) prompt
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
            <label>Was it active or passive?</label>
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

    document.getElementById("confirmEntry").onclick = () => {
        const enjoyment = document.getElementById("enjoyment").value;
        const amount = document.getElementById("amount").value;
        const activeness = document.getElementById("activeness").value;
        document.body.removeChild(modal);

        // Save to DB
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

    document.getElementById("cancelEntry").onclick = () => {
        document.body.removeChild(modal);
    };
}




function loadActivities() {
    // Fetch to the server
    fetch("/activities")
        .then(res => res.json())
        .then(data => {
            // Get the container 
            const activitiesContainer = document.getElementById("activities");
            
            // Clear existing activities
            activitiesContainer.innerHTML = '';
            
            // Create a draggable element 
            const colorClasses = ['color1', 'color2', 'color3', 'color4', 'color5'];
            data.forEach(activity => {
                const div = document.createElement("div");
                div.classList.add("activity", colorClasses[Math.floor(Math.random() * colorClasses.length)]);
                div.setAttribute("draggable", "true");
            
                // ✅ Attach all drag handlers
                div.ondragstart = drag;
                div.ondragend = dragEnd;
            
                // Set the activity name
                div.textContent = activity.name;
            
                // Append to container
                activitiesContainer.appendChild(div);
            });
        })
        .catch(err => {
            console.error("Error loading activities:", err);
            alert("Failed to load activities. Please try again later.");
        });
}


function addActivity() {
    //Get the activity name 
    const name = document.getElementById("activity-name").value.trim();
    
    // Check  empty
    if (name) {
        //  add the new activity
        fetch("/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }) // Send the activity name 
        })
        .then(res => res.json())
        .then(data => {
            // Show a confirmation message
            alert(data.message);
            
            // Reload the activities list 
            loadActivities();
        })
        .catch(err => {
            console.error("Error adding activity:", err);
            alert("Failed to add activity. Please try again later.");
        });
    }
}

function deleteActivity(id) {
    // Send a DELETE request 
    fetch(`/activities?id=${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            // Show a confirmation message
            alert(data.message);
            
            // Reload 
            loadActivities();
        })
        .catch(err => {
            console.error("Error deleting activity:", err);
            alert("Failed to delete activity. Please try again later.");
        });
}


document.addEventListener("DOMContentLoaded", loadActivities);