import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#141c2e',
              color: '#e8edf5',
              border: '1px solid #1e2d4a',
              borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#00e676', secondary: '#000' } },
            error: { iconTheme: { primary: '#ff3d71', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
