// Open the modal dialog to add a new event for the selected date
function openAddModal(date) {
  document.getElementById('eventDate').value = date;
  // Initialize and show the Bootstrap modal
  const modal = new bootstrap.Modal(document.getElementById('eventModal'));
  modal.show();
}
// Add a submit event listener to the event form
document.getElementById('eventForm').addEventListener('submit', async function(e) {
  // Prevent the default form submission behavior (page reload)
  e.preventDefault();
  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());
  // Send a POST request

  const res = await fetch('/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    window.location.reload();
  }
});
//Test function, not in use
document.getElementById('submitButton').addEventListener('click', async function() {
  const inputText = document.getElementById('inputText').value;
  const outputBox = document.getElementById('outputBox');

  if (inputText) {
    try {
      const res = await fetch('/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText })
      });

      if (res.ok) {
        const result = await res.json();
        // Use marked.parse() to convert Markdown to HTML.
        outputBox.innerHTML = marked.parse(result.message || 'Successful');
      } else {
        outputBox.textContent = 'Error occurred';
      }
    } catch (error) {
      outputBox.textContent = 'Network error: ' + error.message;
    }
  } else {
    outputBox.textContent = 'Cannot be empty';
  }
});
// Add an event listener to the "Analyze" button to trigger the analysis when clicked
document.getElementById('analyzeBtn').addEventListener('click', async function() {
  const day = document.getElementById('daySelect').value;
  const resultDiv = document.getElementById('analysisResult');
// If no day is selected, show a warning message
  if (!day) {
    resultDiv.innerHTML = '<div class="alert alert-warning">Please select a day</div>';
    return;
  }

  try {
    // Show a loading spinner
    resultDiv.innerHTML = '<div class="spinner-border"></div> Analyzing...';

    const eventsRes = await fetch(`/epic2/events-by-day?day=${encodeURIComponent(day)}`);
    const events = await eventsRes.json();
// Send the selected day and events data to the server
    const analysisRes = await fetch('/analyze-with-deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day,
        events
      })
    });

    const result = await analysisRes.json();

    // Combine message and suggestion, then convert Markdown to HTML.
    let combinedMessage = result.message;
    if (result.suggestion) {
      combinedMessage += `\n\n<hr>\n\n**Suggestion:** ${result.suggestion}`;
    }
    
    resultDiv.innerHTML = `
      <div class="alert alert-info">
        <h5>${day} Analysis</h5>
        ${marked.parse(combinedMessage)}
      </div>
    `;
  } catch (error) {
    resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
});


function deleteEventsForDate(button) {
  const date = button.getAttribute('data-date');

  if (!confirm(`Are you sure you want to delete all events for ${date}?`)) return;

  fetch('/epic2/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date: date })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'deleted') {
      alert('Events deleted successfully.');
      location.reload(); // refresh the page
    } else {
      alert('Something went wrong.');
    }
  });
}


function editEvent(id, date, title, description, startTime, endTime) {
  document.getElementById('eventDate').value = date;
  document.querySelector('#eventForm input[name="title"]').value = title;
  document.querySelector('#eventForm textarea[name="description"]').value = description;
  document.querySelector('#eventForm input[name="start_time"]').value = startTime;
  document.querySelector('#eventForm input[name="end_time"]').value = endTime;

  // Store event ID in a hidden field
  document.getElementById('eventForm').setAttribute('data-edit-id', id);

  const modal = new bootstrap.Modal(document.getElementById('eventModal'));
  modal.show();
}

document.getElementById('eventForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());
  const editId = this.getAttribute('data-edit-id');
  const url = editId ? `/edit/${editId}` : '/add';
  const method = editId ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    window.location.reload();
  }
});

function deleteSingleEvent(id) {
  if (!confirm('Delete this event?')) return;

  fetch(`/delete/${id}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'deleted') {
      alert('Event deleted');
      location.reload();
    } else {
      alert('Delete failed');
    }
  });
}



