document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData();
  const fileInput = document.getElementById('fileInput');
  const urlInput = document.getElementById('urlInput').value.trim();

  if (fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  } else if (urlInput !== '') {
    formData.append('image_url', urlInput);
  } else {
    alert('Please select a file or enter a URL.');
    return;
  }

  try {
    const response = await fetch('/detect/api', {   
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log(data);

    if (data.error) {
      document.getElementById('result').innerText = "Error: " + data.error;
    } else {
      document.getElementById('result').innerHTML = `
        <strong>Verdict:</strong> ${data.report.verdict}<br>
        <strong>AI Score:</strong> ${data.report.ai_score}
      `;
    }
  } catch (error) {
    console.error(error);
    document.getElementById('result').innerText = "Error occurred.";
  }
});
