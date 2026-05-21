import { compile, derivative } from 'mathjs';

// Parses an expression and returns a function
export function parseExpr(exprStr, variables, params) {
  try {
    const compiled = compile(exprStr);
    return (...args) => {
      let scope = { ...params };
      variables.forEach((v, i) => {
        scope[v] = args[i];
      });
      return compiled.evaluate(scope);
    };
  } catch (e) {
    console.error("Error parsing expression", exprStr, e);
    return () => 0;
  }
}

// Simple Runge-Kutta 4 integrator for 1D
export function solve1D(exprStr, params, x0, tSpan, nPoints = 1000) {
  const f = parseExpr(exprStr, ['x'], params);
  const t = [];
  const x = [];
  
  let currentT = tSpan[0];
  let currentX = x0;
  const dt = (tSpan[1] - tSpan[0]) / (nPoints - 1);
  
  for (let i = 0; i < nPoints; i++) {
    t.push(currentT);
    x.push(currentX);
    
    let k1 = f(currentX);
    let k2 = f(currentX + 0.5 * dt * k1);
    let k3 = f(currentX + 0.5 * dt * k2);
    let k4 = f(currentX + dt * k3);
    
    currentX = currentX + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    currentT += dt;
  }
  return { t, x };
}

// RK4 integrator for 2D
export function solve2D(fxStr, fyStr, params, x0, y0, tSpan, nPoints = 2000) {
  const fx = parseExpr(fxStr, ['x', 'y'], params);
  const fy = parseExpr(fyStr, ['x', 'y'], params);
  
  const t = [];
  const x = [];
  const y = [];
  
  let currentT = tSpan[0];
  let currentX = x0;
  let currentY = y0;
  const dt = (tSpan[1] - tSpan[0]) / (nPoints - 1);
  
  for (let i = 0; i < nPoints; i++) {
    t.push(currentT);
    x.push(currentX);
    y.push(currentY);
    
    let k1x = fx(currentX, currentY);
    let k1y = fy(currentX, currentY);
    
    let k2x = fx(currentX + 0.5 * dt * k1x, currentY + 0.5 * dt * k1y);
    let k2y = fy(currentX + 0.5 * dt * k1x, currentY + 0.5 * dt * k1y);
    
    let k3x = fx(currentX + 0.5 * dt * k2x, currentY + 0.5 * dt * k2y);
    let k3y = fy(currentX + 0.5 * dt * k2x, currentY + 0.5 * dt * k2y);
    
    let k4x = fx(currentX + dt * k3x, currentY + dt * k3y);
    let k4y = fy(currentX + dt * k3x, currentY + dt * k3y);
    
    currentX = currentX + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    currentY = currentY + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    currentT += dt;
  }
  return { t, x, y };
}

// RK4 integrator for 3D
export function solve3D(fxStr, fyStr, fzStr, params, x0, y0, z0, tSpan, nPoints = 5000) {
  const fx = parseExpr(fxStr, ['x', 'y', 'z'], params);
  const fy = parseExpr(fyStr, ['x', 'y', 'z'], params);
  const fz = parseExpr(fzStr, ['x', 'y', 'z'], params);
  
  const t = [];
  const x = [];
  const y = [];
  const z = [];
  
  let currentT = tSpan[0];
  let currentX = x0;
  let currentY = y0;
  let currentZ = z0;
  const dt = (tSpan[1] - tSpan[0]) / (nPoints - 1);
  
  for (let i = 0; i < nPoints; i++) {
    t.push(currentT);
    x.push(currentX);
    y.push(currentY);
    z.push(currentZ);
    
    let k1x = fx(currentX, currentY, currentZ);
    let k1y = fy(currentX, currentY, currentZ);
    let k1z = fz(currentX, currentY, currentZ);
    
    let k2x = fx(currentX + 0.5 * dt * k1x, currentY + 0.5 * dt * k1y, currentZ + 0.5 * dt * k1z);
    let k2y = fy(currentX + 0.5 * dt * k1x, currentY + 0.5 * dt * k1y, currentZ + 0.5 * dt * k1z);
    let k2z = fz(currentX + 0.5 * dt * k1x, currentY + 0.5 * dt * k1y, currentZ + 0.5 * dt * k1z);
    
    let k3x = fx(currentX + 0.5 * dt * k2x, currentY + 0.5 * dt * k2y, currentZ + 0.5 * dt * k2z);
    let k3y = fy(currentX + 0.5 * dt * k2x, currentY + 0.5 * dt * k2y, currentZ + 0.5 * dt * k2z);
    let k3z = fz(currentX + 0.5 * dt * k2x, currentY + 0.5 * dt * k2y, currentZ + 0.5 * dt * k2z);
    
    let k4x = fx(currentX + dt * k3x, currentY + dt * k3y, currentZ + dt * k3z);
    let k4y = fy(currentX + dt * k3x, currentY + dt * k3y, currentZ + dt * k3z);
    let k4z = fz(currentX + dt * k3x, currentY + dt * k3y, currentZ + dt * k3z);
    
    currentX = currentX + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    currentY = currentY + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    currentZ = currentZ + (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    currentT += dt;
  }
  return { t, x, y, z };
}

// Root finding for 1D using Newton-Raphson + Grid Search
export function findEquilibria1D(exprStr, params, xRange, nSeeds = 200) {
  const f = parseExpr(exprStr, ['x'], params);
  const equilibria = [];
  
  let dx = (xRange[1] - xRange[0]) / nSeeds;
  
  // Find sign changes to get good seeds
  for (let i = 0; i < nSeeds; i++) {
    let x1 = xRange[0] + i * dx;
    let x2 = xRange[0] + (i + 1) * dx;
    let y1 = f(x1);
    let y2 = f(x2);
    
    if (y1 * y2 <= 0) {
      // Newton Raphson
      let x = x1;
      let iter = 0;
      let found = false;
      while (iter < 20) {
        let y = f(x);
        if (Math.abs(y) < 1e-8) {
          found = true;
          break;
        }
        let df = (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
        if (Math.abs(df) < 1e-12) break;
        x = x - y / df;
        iter++;
      }
      
      if (found && x >= xRange[0] - 0.1 && x <= xRange[1] + 0.1) {
        // avoid duplicates
        let isDup = equilibria.some(eq => Math.abs(eq - x) < 1e-4);
        if (!isDup) equilibria.push(x);
      }
    }
  }
  equilibria.sort((a,b) => a-b);
  return equilibria;
}

export function classifyEquilibrium1D(exprStr, params, eqPoint) {
  try {
    let dExpr = derivative(exprStr, 'x');
    let scope = { ...params, x: eqPoint };
    let dfVal = dExpr.evaluate(scope);
    
    let type = "Indeterminado";
    if (Math.abs(dfVal) < 1e-8) type = "Semi-estable";
    else if (dfVal < 0) type = "Estable (Atractor)";
    else type = "Inestable (Repulsor)";
    
    return { type, dfVal };
  } catch(e) {
    return { type: "Indeterminado", dfVal: 0 };
  }
}

export function computeBifurcationDiagram(exprStr, paramName, paramRange, otherParams, xRange) {
  const s_p = [], s_x = [], u_p = [], u_x = [];
  const nPoints = 200;
  const dp = (paramRange[1] - paramRange[0]) / nPoints;
  
  for (let i=0; i<=nPoints; i++) {
    let pval = paramRange[0] + i*dp;
    let params = { ...otherParams, [paramName]: pval };
    let eqs = findEquilibria1D(exprStr, params, xRange, 100);
    
    for (let eq of eqs) {
      let cls = classifyEquilibrium1D(exprStr, params, eq);
      if (cls.type.includes("Estable") || cls.type.includes("Atractor")) {
        s_p.push(pval);
        s_x.push(eq);
      } else {
        u_p.push(pval);
        u_x.push(eq);
      }
    }
  }
  return { s_p, s_x, u_p, u_x };
}

// For 2D Equilibria, simple approach: minimize f(x,y)^2 + g(x,y)^2 or grid search
export function findEquilibria2D(fxStr, fyStr, params, xyRange, nSeeds = 30) {
  const fx = parseExpr(fxStr, ['x', 'y'], params);
  const fy = parseExpr(fyStr, ['x', 'y'], params);
  const equilibria = [];
  
  const step = (xyRange[1] - xyRange[0]) / nSeeds;
  
  for(let i=0; i<=nSeeds; i++) {
    for(let j=0; j<=nSeeds; j++) {
      let sx = xyRange[0] + i*step;
      let sy = xyRange[0] + j*step;
      
      // Simple gradient descent / Newton
      let cx = sx;
      let cy = sy;
      let iter = 0;
      let found = false;
      while(iter < 20) {
        let vx = fx(cx, cy);
        let vy = fy(cx, cy);
        
        if (Math.abs(vx) < 1e-6 && Math.abs(vy) < 1e-6) {
          found = true;
          break;
        }
        
        let h = 1e-5;
        let dFxdx = (fx(cx+h, cy) - fx(cx-h, cy))/(2*h);
        let dFxdy = (fx(cx, cy+h) - fx(cx, cy-h))/(2*h);
        let dFydx = (fy(cx+h, cy) - fy(cx-h, cy))/(2*h);
        let dFydy = (fy(cx, cy+h) - fy(cx, cy-h))/(2*h);
        
        let det = dFxdx * dFydy - dFxdy * dFydx;
        if (Math.abs(det) < 1e-10) break;
        
        let dx = (dFydy * vx - dFxdy * vy) / det;
        let dy = (-dFydx * vx + dFxdx * vy) / det;
        
        cx -= dx;
        cy -= dy;
        iter++;
      }
      
      if (found && cx >= xyRange[0] && cx <= xyRange[1] && cy >= xyRange[0] && cy <= xyRange[1]) {
        let isDup = equilibria.some(eq => Math.sqrt((eq[0]-cx)**2 + (eq[1]-cy)**2) < 1e-3);
        if (!isDup) equilibria.push([cx, cy]);
      }
    }
  }
  return equilibria;
}

export function classifyEquilibrium2D(fxStr, fyStr, params, eqPoint) {
  const fx = parseExpr(fxStr, ['x', 'y'], params);
  const fy = parseExpr(fyStr, ['x', 'y'], params);
  const [x0, y0] = eqPoint;
  const h = 1e-6;
  
  let J11 = (fx(x0+h, y0) - fx(x0-h, y0)) / (2*h);
  let J12 = (fx(x0, y0+h) - fx(x0, y0-h)) / (2*h);
  let J21 = (fy(x0+h, y0) - fy(x0-h, y0)) / (2*h);
  let J22 = (fy(x0, y0+h) - fy(x0, y0-h)) / (2*h);
  
  let tr = J11 + J22;
  let det = J11 * J22 - J12 * J21;
  let J = [[J11, J12], [J21, J22]];
  
  // Characteristic eq: lambda^2 - tr * lambda + det = 0
  let discriminant = tr * tr - 4 * det;
  let eigs = [];
  
  let tipo = "Indeterminado";
  
  if (det < 0) {
    tipo = "Punto Silla";
    eigs = [ (tr + Math.sqrt(-discriminant))/2, (tr - Math.sqrt(-discriminant))/2 ]; // Wait, if det<0, discriminant>0. It's real!
    if (discriminant >= 0) {
        eigs = [ (tr + Math.sqrt(discriminant))/2, (tr - Math.sqrt(discriminant))/2 ];
    }
  } else if (Math.abs(det) < 1e-10) {
    tipo = "No aislado";
    eigs = [0, 0];
  } else if (discriminant >= 0) {
    // Reals
    eigs = [ (tr + Math.sqrt(discriminant))/2, (tr - Math.sqrt(discriminant))/2 ];
    if (eigs[0] < 0 && eigs[1] < 0) tipo = "Nodo Estable (Pozo)";
    else if (eigs[0] > 0 && eigs[1] > 0) tipo = "Nodo Inestable (Fuente)";
    else tipo = "Punto Silla";
  } else {
    // Complex
    eigs = [ tr/2, tr/2 ]; // Real parts
    if (tr < -1e-8) tipo = "Foco Estable";
    else if (tr > 1e-8) tipo = "Foco Inestable";
    else tipo = "Centro";
  }
  
  return { tipo, eigs, J, tr, det };
}

export function computeVectorField(fxStr, fyStr, params, xRange, yRange, density=20) {
  const fx = parseExpr(fxStr, ['x', 'y'], params);
  const fy = parseExpr(fyStr, ['x', 'y'], params);
  
  const X = [];
  const Y = [];
  const U = [];
  const V = [];
  
  const dx = (xRange[1] - xRange[0]) / (density - 1);
  const dy = (yRange[1] - yRange[0]) / (density - 1);
  
  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      let x = xRange[0] + i * dx;
      let y = yRange[0] + j * dy;
      try {
        let u = fx(x, y);
        let v = fy(x, y);
        X.push(x);
        Y.push(y);
        U.push(u);
        V.push(v);
      } catch(e) {}
    }
  }
  return { X, Y, U, V };
}
