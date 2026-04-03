const CACHE_NAME = 'humanitas-v1';
const OFFLINE_URL = './index.html';

const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&family=Noto+Sans+KR:wght@300;400;700&display=swap'
];

// 설치: 기본 파일 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// fetch: 네트워크 우선, 실패 시 캐시 사용
self.addEventListener('fetch', event => {
  // Firebase 요청은 캐시하지 않음
  if (event.request.url.includes('firebasedatabase') ||
      event.request.url.includes('googleapis.com/identitytoolkit') ||
      event.request.url.includes('securetoken')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공 응답은 캐시에 저장
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인 시 캐시에서 반환
        return caches.match(event.request).then(cached => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});
