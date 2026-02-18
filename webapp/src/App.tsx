import { useEffect, useState } from 'react';
import './App.css'
import RegisterForm from './RegisterForm';
import reactLogo from './assets/react.svg'

function App() {
  const [status, setStatus] = useState<string>('Cargando...');

  useEffect(() => {
    fetch('http://4.233.138.159:4000/status')
      .then(res => res.text())
      .then(data => setStatus(data))
      .catch(err => setStatus(`Error: ${err.message}`));
  }, []);

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h2>Welcome to the Software Arquitecture 2025-2026 course</h2>
      <p>{"Server status: " + status}</p>
      <RegisterForm />
    </div>
  );
}

export default App;