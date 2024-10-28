// 오늘 날짜를 가져오는 함수 (YYYY-MM-DD 형식)
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// 탭이 업데이트될 때마다 호출되는 함수
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('stackoverflow.com/questions/')) {
    const today = getTodayDate();

    // 저장된 데이터를 불러와서 오늘 날짜와 같은 방문 기록만 저장
    chrome.storage.local.get({ visitedUrls: [] }, (data) => {
      const updatedUrls = data.visitedUrls;
      const existingEntry = updatedUrls.find(entry => entry.url === tab.url && entry.date === today);

      if (!existingEntry) {
        updatedUrls.push({ url: tab.url, date: today });
        chrome.storage.local.set({ visitedUrls: updatedUrls }, () => {
          console.log('URL recorded:', tab.url);
        });
      }
    });
  }
});

// 자정 알람 설정 (설치 시와 확장 프로그램이 재로드될 때 설정)
chrome.runtime.onInstalled.addListener(() => {
  setMidnightAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  setMidnightAlarm();
});

function setMidnightAlarm() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);  // 자정 시간 설정

  const timeUntilMidnight = midnight.getTime() - now.getTime();
  chrome.alarms.create('midnightAlarm', { when: Date.now() + timeUntilMidnight, periodInMinutes: 1440 });
}

// 자정 알람이 울리면 호출되는 함수
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'midnightAlarm') {
    exportVisitedUrls();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'exportVisitedUrls') {
    exportVisitedUrls();
    sendResponse({ success: true });
  }
});

function exportVisitedUrls() {
  chrome.storage.local.get({ visitedUrls: [] }, (data) => {
    const visitedUrls = data.visitedUrls;

    if (visitedUrls.length > 0) {
      const today = getTodayDate();
      const todayUrls = visitedUrls.filter(entry => entry.date === today);

      if (todayUrls.length > 0) {
        // 서버로 전송할 데이터 준비
        const payload = {
          userid: "sehoon1106",
          history: todayUrls.map(entry => ({
            date: entry.date,
            url: entry.url
          }))
        };

        // 데이터 서버로 전송
        fetch('http://13.209.82.235:8000/api/diary/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        .then(response => {
          if (response.ok) {
            console.log('Data sent successfully:', payload);
          } else {
            console.error('Failed to send data:', response.status, 'Payload:', JSON.stringify(payload));  // 전송 실패한 payload 출력);
          }
        })
        .catch(error => {
          console.error('Error sending data:', error, 'Payload:', JSON.stringify(payload));  // 전송 실패한 payload 출력);
        });
      }

      // 기록 초기화
      chrome.storage.local.set({ visitedUrls: [] });
    }
  });
}
