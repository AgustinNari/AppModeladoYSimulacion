import React, { useState, useEffect, useRef } from 'react';
import PlotlyComponent from 'react-plotly.js';
const Plot = PlotlyComponent.default || PlotlyComponent;
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Play, Wind } from 'lucide-react';
import { PRESETS_2D } from '../engine/simPresets';
import { solve2D, findEquilibria2D, classifyEquilibrium2D, computeVectorField } from '../engine/simEngine';

const COLORS = {
  primary: "#6C63FF", secondary: "#FF6584", accent: "#00D2FF", 
  stable: "#00E676", unstable: "#FF5252", saddle: "#FFD740", center: "#40C4FF",
  text: "#FAFAFA", bg: "#0E1117", grid: "#1E2433"
};

const getStabilityColor = (cls) => {
  if (cls.includes("Estable") && !cls.includes("Inestable")) return COLORS.stable;
  if (cls.includes("Inestable") || cls.includes("Fuente")) return COLORS.unstable;
  if (cls.includes("Silla")) return COLORS.saddle;
  if (cls.includes("Centro")) return COLORS.center;
  return COLORS.text;
};

export default function Simulator2D() {
  const [mode, setMode] = useState('Preset');
  const [presetName, setPresetName] = useState(Object.keys(PRESETS_2D)[0]);
  const [params, setParams] = useState(PRESETS_2D[presetName].params);
  const [paramVals, setParamVals] = useState(
    Object.fromEntries(Object.entries(PRESETS_2D[presetName].params).map(([k, v]) => [k, v.default]))
  );
  
  const [fxStr, setFxStr] = useState(PRESETS_2D[presetName].fx);
  const [fyStr, setFyStr] = useState(PRESETS_2D[presetName].fy);
  const [x0, setX0] = useState(PRESETS_2D[presetName].x0);
  const [y0, setY0] = useState(PRESETS_2D[presetName].y0);
  const [tEnd, setTEnd] = useState(PRESETS_2D[presetName].t_span[1]);
  const [xRange, setXRange] = useState(PRESETS_2D[presetName].x_range);
  const [yRange, setYRange] = useState(PRESETS_2D[presetName].y_range);
  const [labels, setLabels] = useState(PRESETS_2D[presetName].labels || ['x', 'y']);
  
  const [results, setResults] = useState(null);
  const [particleIndex, setParticleIndex] = useState(0);
  const [vectorDensity, setVectorDensity] = useState(15);
  const animationRef = useRef(null);

  useEffect(() => {
    if (mode === 'Preset') {
      const p = PRESETS_2D[presetName];
      setFxStr(p.fx);
      setFyStr(p.fy);
      setParams(p.params);
      setParamVals(Object.fromEntries(Object.entries(p.params).map(([k, v]) => [k, v.default])));
      setX0(p.x0);
      setY0(p.y0);
      setTEnd(p.t_span[1]);
      setXRange(p.x_range);
      setYRange(p.y_range);
      setLabels(p.labels || ['x', 'y']);
    }
  }, [presetName, mode]);

  const runSimulation = (startX = x0, startY = y0) => {
    if (animationRef.current) clearTimeout(animationRef.current);
    try {
      const eqs = findEquilibria2D(fxStr, fyStr, paramVals, [Math.min(xRange[0], yRange[0]), Math.max(xRange[1], yRange[1])]);
      const clss = eqs.map(eq => classifyEquilibrium2D(fxStr, fyStr, paramVals, eq));
      const { t, x, y } = solve2D(fxStr, fyStr, paramVals, startX, startY, [0, tEnd]);
      const vectorField = computeVectorField(fxStr, fyStr, paramVals, xRange, yRange, vectorDensity);
      
      setResults({ eqs, clss, t, x, y, vectorField });
      
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

  const handleRun = () => runSimulation(x0, y0);

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  const getVectorFieldQuiver = () => {
    if (!results || !results.vectorField) return [];
    const { X, Y, U, V } = results.vectorField;
    // Calculate magnitude for scaling
    let maxMag = 0;
    for(let i=0; i<U.length; i++) {
        let m = Math.sqrt(U[i]*U[i] + V[i]*V[i]);
        if(m > maxMag) maxMag = m;
    }
    const scale = (xRange[1]-xRange[0]) / 25 / (maxMag || 1);
    
    // We create line segments for the quiver plot
    const quiverX = [];
    const quiverY = [];
    for(let i=0; i<X.length; i++) {
        quiverX.push(X[i], X[i] + U[i]*scale, null);
        quiverY.push(Y[i], Y[i] + V[i]*scale, null);
    }
    return [{
        x: quiverX, y: quiverY,
        type: 'scatter', mode: 'lines',
        line: { color: 'rgba(108,99,255,0.4)', width: 1 },
        hoverinfo: 'none', showlegend: false
    }];
  };

  return (
    <div className="sim-grid glass-panel p-6">
      <div className="glass-panel p-4" style={{ padding: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <Wind color={COLORS.primary} /> Configuración 2D
        </h3>
        
        <div className="settings-card glass-panel p-4 mb-4" style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: COLORS.accent }}>1. Ecuaciones del Sistema</h4>
          <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
            <button className={`tab-btn ${mode==='Preset'?'active':''}`} style={{flex:1}} onClick={()=>setMode('Preset')}>Preset</button>
            <button className={`tab-btn ${mode==='Custom'?'active':''}`} style={{flex:1}} onClick={()=>setMode('Custom')}>Libre</button>
          </div>

          {mode === 'Preset' && (
            <div className="control-group">
              <label className="control-label">Sistema</label>
              <select className="select-field" value={presetName} onChange={e => setPresetName(e.target.value)}>
                {Object.keys(PRESETS_2D).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          )}

          <div className="control-group">
            <label className="control-label">ẋ = f(x,y)</label>
            <input type="text" className="input-field" value={fxStr} onChange={e => setFxStr(e.target.value)} disabled={mode==='Preset'} />
          </div>
          <div className="control-group">
            <label className="control-label">ẏ = g(x,y)</label>
            <input type="text" className="input-field" value={fyStr} onChange={e => setFyStr(e.target.value)} disabled={mode==='Preset'} />
          </div>
        </div>

        <div className="settings-card glass-panel p-4 mb-4" style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: COLORS.accent }}>2. Parámetros</h4>
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
          {Object.keys(params).length === 0 && <div style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>No hay parámetros ajustables</div>}
        </div>

        <div className="settings-card glass-panel p-4 mb-4" style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: COLORS.accent }}>3. Simulación</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="control-group" style={{flex:1}}>
              <label className="control-label">x₀ (Inicial)</label>
              <input type="number" className="input-field" value={x0} onChange={e => setX0(parseFloat(e.target.value))} />
            </div>
            <div className="control-group" style={{flex:1}}>
              <label className="control-label">y₀ (Inicial)</label>
              <input type="number" className="input-field" value={y0} onChange={e => setY0(parseFloat(e.target.value))} />
            </div>
          </div>
          <div className="control-group">
            <label className="control-label">Densidad de Flechas: {vectorDensity}</label>
            <input type="range" min="5" max="30" step="1" value={vectorDensity} onChange={e => setVectorDensity(parseInt(e.target.value))} />
          </div>
          <button className="btn-primary" onClick={handleRun} style={{marginTop: '10px'}}>
            <Play size={18} /> Calcular y Animar
          </button>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center'}}>
            💡 <strong>Tip:</strong> Hacé clic en el gráfico de fase para simular desde ahí.
          </div>
        </div>
        
        {mode === 'Preset' && PRESETS_2D[presetName].theory && (
          <div className="theory-box glass-panel mt-6" style={{ marginTop: '2rem' }}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {PRESETS_2D[presetName].theory}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="glass-panel p-4" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {results ? (
          <>
            {results.eqs.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: COLORS.accent }}>Puntos de Equilibrio</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {results.eqs.map((eq, i) => (
                    <div key={i} className="eq-card" style={{ borderLeft: `4px solid ${getStabilityColor(results.clss[i].tipo)}` }}>
                      <strong>({eq[0].toFixed(2)}, {eq[1].toFixed(2)})</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{results.clss[i].tipo}</span><br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        λ₁={typeof results.clss[i].eigs[0] === 'number' ? results.clss[i].eigs[0].toFixed(2) : results.clss[i].eigs[0].re?.toFixed(2)} 
                        λ₂={typeof results.clss[i].eigs[1] === 'number' ? results.clss[i].eigs[1].toFixed(2) : results.clss[i].eigs[1].re?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <style>{`
              .charts-grid-2d { display: flex; flex-direction: column; gap: 1.5rem; }
            `}</style>

            <div className="charts-grid-2d">
              <div className="plot-container">
                <Plot
                  onClick={(data) => {
                    if (data && data.points && data.points.length > 0) {
                      const px = data.points[0].x;
                      const py = data.points[0].y;
                      setX0(Number(px.toFixed(2)));
                      setY0(Number(py.toFixed(2)));
                      runSimulation(px, py);
                    }
                  }}
                  data={[
                    ...getVectorFieldQuiver(),
                    { x: results.x, y: results.y, type: 'scatter', mode: 'lines', name: 'Trayectoria', line: { color: 'rgba(0, 210, 255, 0.4)', width: 1.5 }, hoverinfo: 'none' },
                    { x: [results.x[particleIndex]], y: [results.y[particleIndex]], type: 'scatter', mode: 'markers', name: 'Partícula', marker: { size: 12, color: COLORS.primary, symbol: 'star' }, hoverinfo: 'none' },
                    { x: results.eqs.map(e=>e[0]), y: results.eqs.map(e=>e[1]), type: 'scatter', mode: 'markers', name: 'Equilibrios', 
                      marker: { size: 14, color: results.clss.map(c => getStabilityColor(c.tipo)), line: { color: 'white', width: 2 } }, hoverinfo: 'none' 
                    }
                  ]}
                  layout={{
                    title: 'Retrato de Fase 2D', template: 'plotly_dark',
                    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: COLORS.text, family: 'Inter' },
                    xaxis: { title: labels[0], range: xRange }, yaxis: { title: labels[1], range: yRange, scaleanchor: 'x' },
                    margin: { l: 50, r: 30, t: 50, b: 50 },
                    hovermode: 'closest'
                  }}
                  useResizeHandler={true} style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                />
              </div>

              <div className="plot-container">
                <Plot
                  data={[
                    { x: results.t, y: results.x, type: 'scatter', mode: 'lines', name: labels[0], line: { color: COLORS.primary, width: 2 } },
                    { x: results.t, y: results.y, type: 'scatter', mode: 'lines', name: labels[1], line: { color: COLORS.secondary, width: 2 } },
                    { x: [results.t[particleIndex], results.t[particleIndex]], y: [results.x[particleIndex], results.y[particleIndex]], type: 'scatter', mode: 'markers', name: 'Actual', marker: { size: 10, color: COLORS.text } }
                  ]}
                  layout={{
                    title: 'Series Temporales', template: 'plotly_dark',
                    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: COLORS.text, family: 'Inter' },
                    xaxis: { title: 't' }, yaxis: { title: 'Valor' },
                    margin: { l: 50, r: 30, t: 50, b: 50 }
                  }}
                  useResizeHandler={true} style={{ width: '100%', height: '100%' }}
                />
              </div>
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
