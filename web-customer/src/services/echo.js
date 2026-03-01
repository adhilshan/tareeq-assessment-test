import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const wsHost = import.meta.env.VITE_WS_HOST || 'localhost';
const wsPort = import.meta.env.VITE_WS_PORT || 6001;
const wsKey = import.meta.env.VITE_WS_KEY || 'app-key';
const wsCluster = import.meta.env.VITE_WS_CLUSTER || 'mt1';
const wsScheme = wsPort === 443 ? 'https' : 'http';

export const createEcho = (token) => {
  return new Echo({
    broadcaster: 'pusher',
    key: wsKey,
    wsHost,
    wsPort,
    wssPort: wsPort,
    forceTLS: wsScheme === 'https',
    enabledTransports: ['ws', 'wss'],
    cluster: wsCluster,
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};
