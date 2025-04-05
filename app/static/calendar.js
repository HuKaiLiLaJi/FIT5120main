
function openAddModal(date) {
    document.getElementById('eventDate').value = date;
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    modal.show();
  }
  
  document.getElementById('eventForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
  
    const res = await fetch('/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  
    if (res.ok) {
      window.location.reload();
    }
  });
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
          outputBox.textContent = result.message || 'Successful';  
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
  