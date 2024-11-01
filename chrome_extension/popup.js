document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportBtn');

  // 저장된 방문 기록을 표시
  chrome.storage.local.get({ visitedUrls: [] }, (data) => {
    const urlList = document.getElementById('urlList');
    data.visitedUrls.forEach((entry) => {
      const listItem = document.createElement('li');
      listItem.textContent = entry.url + ' (Date: ' + entry.date + ')';
      urlList.appendChild(listItem);
    });
  });

  // "Export Now" 버튼 클릭 시 즉시 기록 내보내기
  exportBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'exportVisitedUrls' }, (response) => {
      if (response.success) {
        console.log('URLs exported successfully');
      } else {
        console.log('Failed to export URLs');
      }
    });
  });
});