// @ts-check

document.addEventListener('DOMContentLoaded', function () {
    const btn1 = document.getElementById('epic1');
    const btn2 = document.getElementById('epic2');
  
    if (btn1 && btn2) {
      btn1.addEventListener('click', function () {
        window.location.href = '/epic1';
      });
  
      btn2.addEventListener('click', function () {
        window.location.href = '/epic2';
      });
    }
  });
  