//Add an event listener to the form with ID 'uploadForm'
document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault(); //Prevent default form submission behavior

  const formData = new FormData();
  const fileInput = document.getElementById('fileInput');
  const urlInput = document.getElementById('urlInput').value.trim();

  if (fileInput.files.length > 0) {//Check if a file was selected
    formData.append('file', fileInput.files[0]);
  } else if (urlInput !== '') { //If no file, check if a URL was provided
    formData.append('image_url', urlInput);
  } else {
    alert('Please select a file or enter a URL.');//If neither file nor URL is provided, show an alert and exit
    return;
  }

  try {
    const response = await fetch('/detect/api', {   //Send the formData to the backend
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log(data);

    //Check if the API returned an error
    if (data.error) {
      document.getElementById('result').innerText = "Error: " + data.error;
    } else {
      document.getElementById('result').innerHTML = `       
        <strong>Verdict:</strong> ${data.report.verdict}<br>
        <strong>AI Score:</strong> ${data.report.ai_score}
      `;// Display the detection result
    }
  } catch (error) {
    console.error(error);
    document.getElementById('result').innerText = "Error occurred.";
  }
});
