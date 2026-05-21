import React, { useState } from 'react';
import Simulator1D from './components/Simulator1D';
import Simulator2D from './components/Simulator2D';
import Simulator3D from './components/Simulator3D';
import { Activity, Wind, Infinity } from 'lucide-react';
import './index.css';
import 'katex/dist/katex.min.css';

function App() {
  const [activeTab, setActiveTab] = useState('1D');

  return (
    <div className="app-container fade-in">
      <h1 className="hero-title gradient-text">🌀 Simulador de Sistemas Dinámicos</h1>
      <p className="hero-sub">Modelado y Simulación — Análisis interactivo en 1D, 2D y 3D</p>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === '1D' ? 'active' : ''}`}
          onClick={() => setActiveTab('1D')}
        >
          <Activity size={18} /> Sistemas 1D
        </button>
        <button 
          className={`tab-btn ${activeTab === '2D' ? 'active' : ''}`}
          onClick={() => setActiveTab('2D')}
        >
          <Wind size={18} /> Sistemas 2D
        </button>
        <button 
          className={`tab-btn ${activeTab === '3D' ? 'active' : ''}`}
          onClick={() => setActiveTab('3D')}
        >
          <Infinity size={18} /> Sistemas 3D / Caos
        </button>
      </div>

      <div className="tab-content">
        {activeTab === '1D' && <Simulator1D />}
        {activeTab === '2D' && <Simulator2D />}
        {activeTab === '3D' && <Simulator3D />}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Simulador de Sistemas Dinámicos — Modelado y Simulación © 2026
      </div>
    </div>
  );
}

export default App;
