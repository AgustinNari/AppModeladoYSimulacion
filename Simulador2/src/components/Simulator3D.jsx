import React, { useState, useEffect, useRef } from 'react';
import PlotlyComponent from 'react-plotly.js';
const Plot = PlotlyComponent.default || PlotlyComponent;
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Play, Infinity as InfinityIcon } from 'lucide-react';
import { PRESETS_3D } from '../engine/simPresets';
import { solve3D } from '../engine/simEngine';

const COLORS = {
  primary: "#6C63FF", secondary: "#FF6584", accent: "#00D2FF", 
  stable: "#00E676", unstable: "#FF5252",
  text: "#FAFAFA", bg: "#0E1117", grid: "#1E2433"
};

export default function Simulator3D() {
  const [mode, setMode] = useState('Preset');
  const [presetName, setPresetName] = useState(Object.keys(PRESETS_3D)[0]);
  const [params, setParams] = useState(PRESETS_3D[presetName].params);
  const [paramVals, setParamVals] = useState(
    Object.fromEntries(Object.entries(PRESETS_3D[presetName].params).map(([k, v]) => [k, v.default]))
  );
  
  const [fxStr, setFxStr] = useState(PRESETS_3D[presetName].fx);
  const [fyStr, setFyStr] = useState(PRESETS_3D[presetName].fy);
  const [fzStr, setFzStr] = useState(PRESETS_3D[presetName].fz);
  const [x0, setX0] = useState(PRESETS_3D[presetName].x0);
  const [y0, setY0] = useState(PRESETS_3D[presetName].y0);
  const [z0, setZ0] = useState(PRESETS_3D[presetName].z0);
  const [tEnd, setTEnd] = useState(PRESETS_3D[presetName].t_span[1]);
  
  const [results, setResults] = useState(null);
  const [particleIndex, setParticleIndex] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (mode === 'Preset') {
      const p = PRESETS_3D[presetName];
      setFxStr(p.fx);
      setFyStr(p.fy);
      setFzStr(p.fz);
      setParams(p.params);
      setParamVals(Object.fromEntries(Object.entries(p.params).map(([k, v]) => [k, v.default])));
      setX0(p.x0);
      setY0(p.y0);
      setZ0(p.z0);
      setTEnd(p.t_span[1]);
    }
  }, [presetName, mode]);

  const handleRun = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    try {
      const { t, x, y, z } = solve3D(fxStr, fyStr, fzStr, paramVals, x0, y0, z0, [0, tEnd]);
      setResults({ t, x, y, z });
      
      let frame = 0;
      setParticleIndex(0);
      const animate = () => {
        if (frame < x.length) {
          setParticleIndex(frame);
          frame += Math.max(1, Math.floor(x.length / 40));
          animationRef.current = setTimeout(animate, 40);
        } else {
          setParticleIndex(x.length - 1);
        }
      };
      animate();
      
    } catch (e) {
      console.error(e);
      alert("Error en las ecuaciones o parámetros");
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  return (
    <div className="sim-grid glass-panel p-6">
      <div className="glass-panel p-4" style={{ padding: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <InfinityIcon color={COLORS.primary} /> Configuración 3D
        </h3>
        
        <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
          <button className={`tab-btn ${mode==='Preset'?'active':''}`} style={{flex:1}} onClick={()=>setMode('Preset')}>Preset</button>
          <button className={`tab-btn ${mode==='Custom'?'active':''}`} style={{flex:1}} onClick={()=>setMode('Custom')}>Libre</button>
        </div>

        {mode === 'Preset' && (
          <div className="control-group">
            <label className="control-label">Sistema</label>
            <select className="select-field" value={presetName} onChange={e => setPresetName(e.target.value)}>
              {Object.keys(PRESETS_3D).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}

        <div className="control-group">
          <label className="control-label">ẋ = f(x,y,z)</label>
          <input type="text" className="input-field" value={fxStr} onChange={e => setFxStr(e.target.value)} disabled={mode==='Preset'} />
        </div>
        <div className="control-group">
          <label className="control-label">ẏ = g(x,y,z)</label>
          <input type="text" className="input-field" value={fyStr} onChange={e => setFyStr(e.target.value)} disabled={mode==='Preset'} />
        </div>
        <div className="control-group">
          <label className="control-label">ż = h(x,y,z)</label>
          <input type="text" className="input-field" value={fzStr} onChange={e => setFzStr(e.target.value)} disabled={mode==='Preset'} />
        </div>

        {Object.keys(params).map(pName => (
          <div className="control-group" key={pName}>
            <label className="control-label">{pName} = {paramVals[pName]?.toFixed(2)}</label>
            <input type="range" 
              min={params[pName].min} max={params[pName].max} step={params[pName].step}
              value={paramVals[pName]}
              onChange={e => setParamVals({...paramVals, [pName]: parseFloat(e.target.value)})}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="control-group" style={{flex:1}}>
            <label className="control-label">x₀</label>
            <input type="number" className="input-field" value={x0} onChange={e => setX0(parseFloat(e.target.value))} />
          </div>
          <div className="control-group" style={{flex:1}}>
            <label className="control-label">y₀</label>
            <input type="number" className="input-field" value={y0} onChange={e => setY0(parseFloat(e.target.value))} />
          </div>
          <div className="control-group" style={{flex:1}}>
            <label className="control-label">z₀</label>
            <input type="number" className="input-field" value={z0} onChange={e => setZ0(parseFloat(e.target.value))} />
          </div>
        </div>

        <button className="btn-primary" onClick={handleRun}>
          <Play size={18} /> Calcular y Animar
        </button>
        
        {mode === 'Preset' && PRESETS_3D[presetName].theory && (
          <div className="theory-box glass-panel mt-6" style={{ marginTop: '2rem' }}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {PRESETS_3D[presetName].theory}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="glass-panel p-4" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {results ? (
          <>
            <div className="plot-container" style={{ minHeight: '600px' }}>
              <Plot
                data={[
                  { 
                    x: results.x, y: results.y, z: results.z, 
                    type: 'scatter3d', mode: 'lines', name: 'Trayectoria', 
                    line: { color: results.t, colorscale: 'Plasma', width: 3 } 
                  },
                  { 
                    x: [results.x[particleIndex]], y: [results.y[particleIndex]], z: [results.z[particleIndex]], 
                    type: 'scatter3d', mode: 'markers', name: 'Partícula', 
                    marker: { size: 6, color: COLORS.stable, symbol: 'circle' } 
                  }
                ]}
                layout={{
                  title: 'Trayectoria 3D', template: 'plotly_dark',
                  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: COLORS.text, family: 'Inter' },
                  scene: {
                    xaxis: { title: 'X', backgroundcolor: '#141821' }, 
                    yaxis: { title: 'Y', backgroundcolor: '#141821' }, 
                    zaxis: { title: 'Z', backgroundcolor: '#141821' }
                  },
                  margin: { l: 0, r: 0, t: 50, b: 0 }
                }}
                useResizeHandler={true} style={{ width: '100%', height: '100%' }}
              />
            </div>
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Configurá los parámetros y presioná "Calcular y Animar"
          </div>
        )}
      </div>
    </div>
  );
}
