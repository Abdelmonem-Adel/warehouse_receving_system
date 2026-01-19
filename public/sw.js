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

// self.addEventListener('notificationclick', function(event) {
//   event.notification.close();
//   event.waitUntil(
//     clients.openWindow('storekeeper.html')
//   );
// });


self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // ركّز على أي tab مفتوح للـ app
      for (const client of clientList) {
        if (client.url.includes('storekeeper.html') && 'focus' in client) {
          return client.focus(); // يفتح tab موجود بدل ما يفتح صفحة جديدة
        }
      }
      // لو مفيش tab مفتوح، افتح صفحة جديدة
      return clients.openWindow('storekeeper.html');
    })
  );
});
