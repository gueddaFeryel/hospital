import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { onMessageListener } from './firebase';

const NotificationComponent = () => {
  const [notification, setNotification] = useState({ title: '', body: '' });

  useEffect(() => {
    const setupNotifications = async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onMessageListener()
          .then((payload) => {
            setNotification({
              title: payload?.notification?.title,
              body: payload?.notification?.body
            });
          })
          .catch((err) => console.log('failed: ', err));
      }
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    if (notification.title) {
      toast.info(`${notification.title}: ${notification.body}`);
    }
  }, [notification]);

  return null;
};

export default NotificationComponent;