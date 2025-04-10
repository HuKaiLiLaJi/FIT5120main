// Import the tableau diagram
document.addEventListener("DOMContentLoaded", function () {
  var divElement = document.getElementById('viz1743726352987');
  var vizElement = divElement.getElementsByTagName('object')[0];
  vizElement.style.width = '100%';
  vizElement.style.height = (divElement.offsetWidth * 0.75) + 'px';

  var scriptElement = document.createElement('script');
  scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
  vizElement.parentNode.insertBefore(scriptElement, vizElement);
});

function submitAge() {
  const age = document.getElementById('age').value;
  fetch('/get-age-recommendation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ age: parseInt(age) })
  })
  .then(response => response.json())
  .then(data => {
    // Render the recommendation using marked.parse to support Markdown formatting.
    document.getElementById('recommendation').innerHTML = marked.parse(data.recommendation);
  })
  .catch(error => {
    document.getElementById('recommendation').innerHTML = 'Error getting recommendation.';
    console.error('Error:', error);
  });
}
