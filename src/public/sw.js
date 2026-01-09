self.addEventListener('push', function(event) {
  let data = { title: 'New Notification', body: 'You have a new message.' };
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3045/3045486.png', // Box icon
    badge: 'https://cdn-icons-png.flaticon.com/512/3045/3045486.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('storekeeper.html')
  );
});
