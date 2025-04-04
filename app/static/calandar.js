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
  