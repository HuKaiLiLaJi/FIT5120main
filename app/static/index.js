// @ts-check

document.addEventListener('DOMContentLoaded', function () {
    const btn1 = document.getElementById('epic1');
    const btn2 = document.getElementById('epic2');
    const btn3 = document.getElementById('epic3');
  
    if (btn1 && btn2 &&btn3) {
      btn1.addEventListener('click', function () {
        window.location.href = '/epic1';
      });
  
      btn2.addEventListener('click', function () {
        window.location.href = '/epic2';
      });
      btn3.addEventListener('click', function () {
        window.location.href = '/story';
      });
    }
  });
  