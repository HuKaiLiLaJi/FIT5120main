function fetchScrapbook() {
    const childId = 1;
    const weekStart = "2025-05-01";

    fetch(`/api/scrapbook/${childId}/${weekStart}`)
    .then(res => res.json())
    .then(data => {
        const scrapbookDiv = document.getElementById("scrapbook");
        scrapbookDiv.innerHTML = JSON.stringify(data, null, 2);
    })
    .catch(err => console.error(err));
}
