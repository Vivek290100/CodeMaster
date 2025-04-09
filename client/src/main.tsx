import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);

registerSW({
  onNeedRefresh() {
    console.log('New content available! Refresh to update.');
  },
  onOfflineReady() {
    console.log('App ready to work offline!');
  },
});
