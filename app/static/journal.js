function allowDrop(ev) {
    //Prevent the default behavior to allow dropping
    ev.preventDefault();
}

function drag(ev) {
    //Get the trimmed text content of the dragged element
    const activityName = ev.target.textContent.trim();  
    
    //Store the activity name in the drag data
    ev.dataTransfer.setData("activity_name", activityName);
}

function drop(ev) {
    // Prevent the default drop behavior
    ev.preventDefault();
    
    // Get the user ID from the input field
    const userId = document.getElementById("user-id").value.trim();
    if (!userId) {
        alert("Please enter a valid user ID before dropping the activity.");
        return;
    }

    // Get the activity name from the drag data
    const activityName = ev.dataTransfer.getData("activity_name");
    
    // Prompt the user for activity details
    const enjoyment = prompt("How enjoyable was this activity? (1-5)");
    const amount = prompt("How much time did you spend? (1-5)");
    const activeness = prompt("How active were you? (1-5)");

    // Validate the inputs 
    if (activityName && enjoyment && amount && activeness) {
        // Send the activity entry to the server
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
            // Check for a success message in the response
            if (data.message) {
                alert(data.message);
                
                // drag the activity to the "Done this week" section
                const doneContainer = document.getElementById("done-this-week");
                const activityDiv = document.createElement("div");
                activityDiv.classList.add("done-activity");
                activityDiv.innerHTML = `
                    <strong>${activityName}</strong><br>
                    Enjoyment: ${enjoyment} / 5<br>
                    Amount: ${amount} / 5<br>
                    Activeness: ${activeness} / 5
                `;
                doneContainer.appendChild(activityDiv);
            } else if (data.error) {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(err => {
            console.error("Error adding activity entry:", err);
            alert("Failed to add the activity entry. Please try again later.");
        });
    }
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
            data.forEach(activity => {
                const div = document.createElement("div");
                div.classList.add("activity"); // Add the "activity" class for styling
                div.setAttribute("draggable", "true"); // Make the element draggable
                div.ondragstart = drag; // Attach the drag event handler
                
                // Set the activity name 
                div.textContent = activity.name;  
                
                // Add the activity element 
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