import React, { useState, useEffect, useRef } from 'react';
import PlotlyComponent from 'react-plotly.js';
const Plot = PlotlyComponent.default || PlotlyComponent;
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Play, Activity } from 'lucide-react';
import { PRESETS_1D } from '../engine/simPresets';
import { solve1D, findEquilibria1D, classifyEquilibrium1D, parseExpr } from '../engine/simEngine';

const COLORS = {
  primary: "#6C63FF", accent: "#00D2FF", stable: "#00E676", unstable: "#FF5252",
  semi: "#FF9800", text: "#FAFAFA", bg: "#0E1117", grid: "#1E2433"
};

const getStabilityColor = (cls) => {
  if (cls.includes("Estable")) return COLORS.stable;
  if (cls.includes("Inestable")) return COLORS.unstable;
  if (cls.includes("Semi")) return COLORS.semi;
  return COLORS.text;
};

export default function Simulator1D() {
  const [mode, setMode] = useState('Preset');
  const [presetName, setPresetName] = useState(Object.keys(PRESETS_1D)[0]);
  const [params, setParams] = useState(PRESETS_1D[presetName].params);
  const [paramVals, setParamVals] = useState(
    Object.fromEntries(Object.entries(PRESETS_1D[presetName].params).map(([k, v]) => [k, v.default]))
  );
  
  const [eqStr, setEqStr] = useState(PRESETS_1D[presetName].equation);
  const [x0, setX0] = useState(PRESETS_1D[presetName].x0);
  const [tEnd, setTEnd] = useState(PRESETS_1D[presetName].t_span[1]);
  const [xRange, setXRange] = useState(PRESETS_1D[presetName].x_range);
  
  const [results, setResults] = useState(null);
  const [particleIndex, setParticleIndex] = useState(0);
  const animationRef = useRef(null);

  // Update when preset changes
  useEffect(() => {
    if (mode === 'Preset') {
      const p = PRESETS_1D[presetName];
      setEqStr(p.equation);
      setParams(p.params);
      setParamVals(Object.fromEntries(Object.entries(p.params).map(([k, v]) => [k, v.default])));
      setX0(p.x0);
      setTEnd(p.t_span[1]);
      setXRange(p.x_range);
    }
  }, [presetName, mode]);

  const handleRun = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    try {
      const eqs = findEquilibria1D(eqStr, paramVals, xRange);
      const clss = eqs.map(eq => classifyEquilibrium1D(eqStr, paramVals, eq));
      const { t, x } = solve1D(eqStr, paramVals, x0, [0, tEnd]);
      setResults({ eqs, clss, t, x });
      
      // Setup live animation
      let frame = 0;
      setParticleIndex(0);
      const animate = () => {
        if (frame < x.length) {
          setParticleIndex(frame);
          frame += Math.max(1, Math.floor(x.length / 40)); // speed up
          animationRef.current = setTimeout(animate, 40);
        } else {
          setParticleIndex(x.length - 1);
        }
      };
      animate();
      
    } catch (e) {
      console.error(e);
      alert("Error en la ecuación o parámetros");
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  // Compute phase diagram data
  let phaseX = [], phaseY = [];
  if (results) {
    const f = parseExpr(eqStr, ['x'], paramVals);
    const n = 200;
    const dx = (xRange[1] - xRange[0]) / (n - 1);
    for (let i = 0; i < n; i++) {
      let vx = xRange[0] + i * dx;
      phaseX.push(vx);
      try { phaseY.push(f(vx)); } catch(e) { phaseY.push(0); }
    }
  }

  return (
    <div className="sim-grid glass-panel p-6">
      <div className="glass-panel p-4" style={{ padding: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <Activity color={COLORS.primary} /> Configuración 1D
        </h3>
        
        <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
          <button className={`tab-btn ${mode==='Preset'?'active':''}`} style={{flex:1}} onClick={()=>setMode('Preset')}>Preset</button>
          <button className={`tab-btn ${mode==='Custom'?'active':''}`} style={{flex:1}} onClick={()=>setMode('Custom')}>Libre</button>
        </div>

        {mode === 'Preset' && (
          <div className="control-group">
            <label className="control-label">Sistema</label>
            <select className="select-field" value={presetName} onChange={e => setPresetName(e.target.value)}>
              {Object.keys(PRESETS_1D).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}

        <div className="control-group">
          <label className="control-label">Ecuación ẋ = f(x)</label>
          <input type="text" className="input-field" value={eqStr} onChange={e => setEqStr(e.target.value)} disabled={mode==='Preset'} />
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

        <div className="control-group">
          <label className="control-label">Condición Inicial (x₀)</label>
          <input type="number" className="input-field" value={x0} onChange={e => setX0(parseFloat(e.target.value))} />
        </div>

        <button className="btn-primary" onClick={handleRun}>
          <Play size={18} /> Calcular y Animar
        </button>
        
        {mode === 'Preset' && PRESETS_1D[presetName].theory && (
          <div className="theory-box glass-panel mt-6" style={{ marginTop: '2rem' }}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {PRESETS_1D[presetName].theory}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {results.eqs.map((eq, i) => (
                    <div key={i} className="eq-card" style={{ borderLeft: `4px solid ${getStabilityColor(results.clss[i].type)}` }}>
                      <strong>x* = {eq.toFixed(4)}</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{results.clss[i].type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="plot-container">
              <Plot
                data={[
                  { x: phaseX, y: phaseY, type: 'scatter', mode: 'lines', name: 'ẋ = f(x)', line: { color: COLORS.primary, width: 3 } },
                  { x: results.eqs, y: Array(results.eqs.length).fill(0), type: 'scatter', mode: 'markers', name: 'Equilibrios', 
                    marker: { size: 12, color: results.clss.map(c => getStabilityColor(c.type)), line: { color: 'white', width: 2 } } 
                  },
                  { x: [results.x[particleIndex]], y: [parseExpr(eqStr, ['x'], paramVals)(results.x[particleIndex])], type: 'scatter', mode: 'markers', name: 'Partícula', marker: { size: 14, color: COLORS.accent, symbol: 'star' } }
                ]}
                layout={{
                  title: 'Diagrama de Fase 1D', template: 'plotly_dark',
                  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: COLORS.text, family: 'Inter' },
                  xaxis: { title: 'x' }, yaxis: { title: 'ẋ' },
                  margin: { l: 50, r: 30, t: 50, b: 50 },
                  shapes: [{ type: 'line', x0: xRange[0], x1: xRange[1], y0: 0, y1: 0, line: { color: COLORS.grid, dash: 'dash' } }]
                }}
                useResizeHandler={true} style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div className="plot-container">
              <Plot
                data={[
                  { x: results.t, y: results.x, type: 'scatter', mode: 'lines', name: 'x(t)', line: { color: COLORS.accent, width: 2.5 } },
                  { x: [results.t[particleIndex]], y: [results.x[particleIndex]], type: 'scatter', mode: 'markers', name: 'Actual', marker: { size: 10, color: COLORS.text } }
                ]}
                layout={{
                  title: 'Serie Temporal x(t)', template: 'plotly_dark',
                  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: COLORS.text, family: 'Inter' },
                  xaxis: { title: 't' }, yaxis: { title: 'x(t)' },
                  margin: { l: 50, r: 30, t: 50, b: 50 }
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
