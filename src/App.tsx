import { WhiteboardCanvas } from './components/WhiteboardCanvas.tsx';
import './App.css';

// Automatically connects to Django Channels backend via environment variable or default host
const DEFAULT_SERVER_URL =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/ws?boardId=default-board`;

export default function App() {
  return (
    <main className="whiteboard-app">
      <WhiteboardCanvas serverUrl={DEFAULT_SERVER_URL} />
    </main>
  );
}
