function submitForm() {
    const fileInput = document.getElementById('fileInput');
    const urlInput = document.getElementById('urlInput');
    const resultBox = document.getElementById('result');
  
    const formData = new FormData();
  
    if (fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
    } else if (urlInput.value.trim() !== '') {
      formData.append('image_url', urlInput.value.trim());
    } else {
      alert('请上传图片或输入图片链接！');
      return;
    }
  
    fetch('/detect/api', {   // 注意这里发到 /detect/api
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      resultBox.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
      resultBox.textContent = '发生错误: ' + error;
    });
  }
  