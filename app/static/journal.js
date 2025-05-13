function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    const activityName = ev.target.textContent.trim();  
    ev.dataTransfer.setData("activity_name", activityName);
}

function drop(ev) {
    ev.preventDefault();
    const activityName = ev.dataTransfer.getData("activity_name");
    const userId = 1;
    const enjoyment = prompt("How enjoyable was this activity? (1-5)");
    const amount = prompt("How much time did you spend? (1-5)");
    const activeness = prompt("How active were you? (1-5)");

    if (activityName && enjoyment && amount && activeness) {
        // 向后端提交数据
        fetch("/activity-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                activity_name: activityName,
                enjoyment: parseInt(enjoyment),
                amount: parseInt(amount),
                activeness: parseInt(activeness)
            })
        }).then(res => res.json())
          .then(data => {
              if (data.message) {
                  alert(data.message);
                  
                  // 在 "Done This Week" 区域显示活动
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
              }
          });
    }
}

function loadActivities() {
    fetch("/activities")
        .then(res => res.json())
        .then(data => {
            const activitiesContainer = document.getElementById("activities");
            activitiesContainer.innerHTML = '';
            data.forEach(activity => {
                const div = document.createElement("div");
                div.classList.add("activity");
                div.setAttribute("draggable", "true");
                div.ondragstart = drag;
                div.textContent = activity.name;  // 使用活动名称
                activitiesContainer.appendChild(div);
            });
        });
}

function addActivity() {
    const name = document.getElementById("activity-name").value.trim();
    if (name) {
        fetch("/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        }).then(res => res.json()).then(data => {
            alert(data.message);
            loadActivities();
        });
    }
}

function deleteActivity(id) {
    fetch(`/activities?id=${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadActivities();
        });
}

document.addEventListener("DOMContentLoaded", loadActivities);