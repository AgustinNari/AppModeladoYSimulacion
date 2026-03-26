import streamlit as st
import numpy as np
import plotly.graph_objects as go
import pandas as pd
import re
import sympy as sp

# Configuración de la página
st.set_page_config(page_title="Santiago Mussi | Numeric Solver", layout="wide")

st.title("Analizador de Métodos Numéricos")
st.markdown("---")

# --- FUNCIONES DE EVALUACIÓN Y DERIVADA ---

def evaluar_f(f_str, x_val):
    """Evalúa funciones para cálculos numéricos rápidos (gráficos y raíces)"""
    try:
        f_proc = f_str.replace("^", "**")
        f_proc = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', f_proc)
        contexto = {
            "np": np, "x": x_val, "sin": np.sin, "cos": np.cos, 
            "tan": np.tan, "exp": np.exp, "log": np.log, 
            "sqrt": np.sqrt, "pi": np.pi, "e": np.e
        }
        return eval(f_proc, {"__builtins__": None}, contexto)
    except:
        return None

def calcular_derivada_robusta(f_str, x_val, h=1e-5):
    f = lambda x: evaluar_f(f_str, x)
    num = -f(x_val + 2*h) + 8*f(x_val + h) - 8*f(x_val - h) + f(x_val - 2*h)
    den = 12 * h
    return num / den

def calcular_error_absoluto(x_nuevo, x_anterior):
    return abs(x_nuevo - x_anterior)

def calcular_error_relativo(x_nuevo, x_anterior):
    if abs(x_nuevo) < 1e-18: return 100.0
    return (abs(x_nuevo - x_anterior) / abs(x_nuevo)) * 100

# --- LÓGICA DE LAGRANGE (SIMBÓLICO EXACTO) ---

def calcular_lagrange_completo(x_points, y_points):
    x_sym = sp.symbols('x')
    n = len(x_points)
    listado_L = []
    polinomio_total = 0
    
    # Convertimos los puntos a racionales de Sympy para evitar decimales flotantes
    # nsimplify busca convertir decimales a su fracción más cercana (0.5 -> 1/2)
    x_exact = [sp.nsimplify(px, constants=[sp.pi, sp.E]) for px in x_points]
    y_exact = [sp.nsimplify(py, constants=[sp.pi, sp.E]) for py in y_points]
    
    for i in range(n):
        li = 1
        for j in range(n):
            if i != j:
                li *= (x_sym - x_exact[j]) / (x_exact[i] - x_exact[j])
        
        # Simplificación de cada base Li
        li_limpio = sp.simplify(li)
        listado_L.append(li_limpio)
        
        polinomio_total += y_exact[i] * li
    
    # Polinomio final expandido y simplificado (mantiene pi y fracciones)
    poly_final = sp.expand(polinomio_total)
    poly_final = sp.simplify(poly_final)
    
    return poly_final, listado_L

def calcular_termino_error_lagrange(x_points, x_eval):
    producto = 1.0
    for xi in x_points:
        producto *= (x_eval - xi)
    return abs(producto)

# --- LÓGICA DE DIFERENCIAS CENTRALES ---

def metodo_diferencias_centrales(x_points, y_points):
    h = x_points[1] - x_points[0]
    derivadas = []
    for i in range(1, len(x_points) - 1):
        d1 = (y_points[i+1] - y_points[i-1]) / (2 * h)
        d2 = (y_points[i+1] - 2*y_points[i] + y_points[i-1]) / (h**2)
        error_truncamiento_estimado = h**2 
        
        derivadas.append({
            "Punto x": x_points[i], 
            "f'(x) (Vel)": d1, 
            "f''(x) (Ace)": d2,
            "Error Local O(h^2)": error_truncamiento_estimado
        })
    return pd.DataFrame(derivadas)

# --- MÉTODOS DE RAÍCES ---

def metodo_biseccion(f_str, a, b, tol, max_iter):
    history = []
    fa, fb = evaluar_f(f_str, a), evaluar_f(f_str, b)
    if fa is None or fb is None or fa * fb >= 0:
        return None, "error_signos", 0, 100
    x_ant = a
    for i in range(max_iter):
        c = (a + b) / 2
        fc = evaluar_f(f_str, c)
        error_abs = calcular_error_absoluto(c, x_ant)
        error_rel = calcular_error_relativo(c, x_ant)
        
        history.append({
            "Iter": i+1, "a": a, "b": b, "x_n (c)": c, 
            "Residual f(c)": fc, 
            "Error Local (Abs)": error_abs, 
            "Error Relativo (%)": error_rel
        })
        
        if abs(fc) < 1e-15 or error_rel < tol:
            return pd.DataFrame(history).set_index("Iter"), "convergencia", c, error_rel
        if fa * fc < 0: b = c
        else: a, fa = c, fc
        x_ant = c
    return pd.DataFrame(history).set_index("Iter"), "limite", x_ant, error_rel

def metodo_newton_raphson(f_str, x0, tol, max_iter):
    history = []
    x_n = x0
    for i in range(max_iter):
        fx = evaluar_f(f_str, x_n)
        dfx = calcular_derivada_robusta(f_str, x_n)
        if dfx is None or abs(dfx) < 1e-15: break
        
        x_next = x_n - fx / dfx
        error_abs = calcular_error_absoluto(x_next, x_n)
        error_rel = calcular_error_relativo(x_next, x_n)
        
        if i > 2 and error_rel > history[-1]["Error Relativo (%)"] * 2:
            return pd.DataFrame(history).set_index("Iter"), "divergencia", x_next, error_rel
            
        history.append({
            "Iter": i+1, "x_n": x_n, "f(x_n)": fx, "f'(x_n)": dfx, "x_n+1": x_next, 
            "Error Local (Abs)": error_abs, 
            "Error Relativo (%)": error_rel
        })
        
        if error_rel < tol:
            return pd.DataFrame(history).set_index("Iter"), "convergencia", x_next, error_rel
        x_n = x_next
    return pd.DataFrame(history).set_index("Iter"), "limite", x_n, error_rel

# --- INTERFAZ STREAMLIT ---

st.sidebar.header("Configuración")
metodo_sel = st.sidebar.selectbox("Selecciona Método", 
    ["Bisección", "Newton-Raphson", "Interpolación Lagrange", "Diferencias Centrales"])

col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("Entrada")
    
    if "Interpolación" in metodo_sel or "Diferencias" in metodo_sel:
        st.info("Ingresa puntos 'x, y' (uno por línea). Admite pi, exp(1), etc.")
        default_pts = "0, 0\npi/2, 1\npi, 0"
        puntos_input = st.text_area("Puntos (x, y):", value=default_pts)
        
        if metodo_sel == "Interpolación Lagrange":
            funcion_teorica_input = st.text_input("Función Teórica f(x) (Opcional):", value="sin(x)")
            x_eval_target = st.number_input("Valor x a evaluar (opcional):", value=0.785398) # pi/4 aprox
            
        try:
            puntos = []
            for line in puntos_input.strip().split('\n'):
                if line.strip():
                    x_str, y_str = line.split(',')
                    # Evaluación para obtener valores numéricos iniciales
                    xv = evaluar_f(x_str.strip(), 0) 
                    yv = evaluar_f(y_str.strip(), 0)
                    if xv is None or yv is None: raise ValueError
                    puntos.append([xv, yv])
            x_pts, y_pts = zip(*puntos)
            x_pts, y_pts = np.array(x_pts), np.array(y_pts)
        except:
            st.error("Error en formato de puntos.")
            
    else:
        func_input = st.text_input("Función:", value="x**2 - 2")
        if metodo_sel == "Bisección":
            a_in = st.number_input("Extremo a", value=0.0)
            b_in = st.number_input("Extremo b", value=2.0)
        else:
            x0_in = st.number_input("Valor inicial x0", value=1.0)
        tol_in = st.number_input("Tolerancia (%)", value=0.001, format="%.6f")
        iter_in = st.slider("Max Iteraciones", 5, 100, 20)

    ejecutar = st.button("Calcular")

with col2:
    if ejecutar:
        fig = go.Figure()
        
        if metodo_sel == "Interpolación Lagrange":
            poly_exacto, lista_Li = calcular_lagrange_completo(x_pts, y_pts)
            
            st.subheader("Resultado Simbólico (Fracciones y Pi)")
            st.markdown("### Polinomio Interpolante $P(x)$:")
            st.latex(sp.latex(poly_exacto))
            
            with st.expander("Ver Polinomios Base $L_i(x)$"):
                for idx, li in enumerate(lista_Li):
                    st.latex(f"L_{{{idx}}}(x) = {sp.latex(li)}")
            
            # Evaluación Simbólica Exacta
            x_sym = sp.symbols('x')
            valor_eval_exacto = sp.simplify(poly_exacto.subs(x_sym, sp.nsimplify(x_eval_target, constants=[sp.pi, sp.E])))
            
            c1, c2 = st.columns(2)
            c1.info(f"Evaluado en x={x_eval_target}:")
            c1.latex(sp.latex(valor_eval_exacto))
            c1.caption(f"Valor decimal: {float(valor_eval_exacto.evalf()):.6f}")

            # Gráfico
            margen = (max(x_pts) - min(x_pts)) * 0.3
            x_range = np.linspace(min(x_pts)-margen, max(x_pts)+margen, 200)
            f_lamb = sp.lambdify(x_sym, poly_exacto, "numpy")
            y_range_lagrange = f_lamb(x_range)
            
            fig.add_trace(go.Scatter(x=x_range, y=y_range_lagrange, name="P(x) - Lagrange", line=dict(color='#00cfcc', width=3)))
            
            if funcion_teorica_input.strip() != "":
                y_range_teorica = [evaluar_f(funcion_teorica_input, xi) for xi in x_range]
                fig.add_trace(go.Scatter(x=x_range, y=y_range_teorica, name="Función Real", line=dict(color='#ff4b4b', dash='dash')))
            
            fig.add_trace(go.Scatter(x=x_pts, y=y_pts, mode='markers', name="Nodos", marker=dict(size=10, color='white')))
            fig.update_layout(template="plotly_dark", title="Interpolación Exacta")
            st.plotly_chart(fig, use_container_width=True)

        elif metodo_sel == "Diferencias Centrales":
            df_derivs = metodo_diferencias_centrales(x_pts, y_pts)
            st.subheader("Cálculo de Derivadas")
            st.dataframe(df_derivs.style.format(precision=6), use_container_width=True)
            
            fig.add_trace(go.Scatter(x=x_pts, y=y_pts, name="Datos", line=dict(dash='dash', color='gray')))
            fig.add_trace(go.Scatter(x=df_derivs["Punto x"], y=df_derivs["f'(x) (Vel)"], name="f'(x)", mode='lines+markers'))
            fig.update_layout(template="plotly_dark")
            st.plotly_chart(fig, use_container_width=True)

        else:
            if metodo_sel == "Bisección":
                df, estado, raiz, err_f = metodo_biseccion(func_input, a_in, b_in, tol_in, iter_in)
            else:
                df, estado, raiz, err_f = metodo_newton_raphson(func_input, x0_in, tol_in, iter_in)

            if df is not None:
                if estado == "convergencia": st.success(f"Raíz encontrada: {raiz:.8f}")
                m1, m2 = st.columns(2)
                m1.metric("Raíz", f"{raiz:.6f}")
                m2.metric("Error Final", f"{err_f:.4f}%")
                st.dataframe(df.style.format(precision=6), use_container_width=True)