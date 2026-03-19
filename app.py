import streamlit as st
import numpy as np
import plotly.graph_objects as go
import pandas as pd
import re

# Configuración de la página
st.set_page_config(page_title="Santiago Mussi | Numeric Solver", layout="wide")

st.title("Analizador de Métodos Numéricos ")
st.markdown("---")

# --- FUNCIONES DE EVALUACIÓN Y DERIVADA ---

def evaluar_f(f_str, x_val):
    """Evalúa la función de forma segura manejando numpy y math."""
    try:
        # Limpieza de strings para Python
        f_proc = f_str.replace("^", "**")
        f_proc = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', f_proc)
        
        # Diccionario de contexto matemático
        contexto = {
            "np": np, "x": x_val, "sin": np.sin, "cos": np.cos, 
            "tan": np.tan, "exp": np.exp, "log": np.log, 
            "sqrt": np.sqrt, "pi": np.pi, "e": np.e
        }
        return eval(f_proc, {"__builtins__": None}, contexto)
    except:
        return None

def calcular_derivada_robusta(f_str, x_val, h=1e-5):
    """
    Diferencia central de 4to orden. 
    Más precisa que scipy.misc.derivative y compatible con Python 3.13.
    """
    f = lambda x: evaluar_f(f_str, x)
    # Fórmula: (-f(x+2h) + 8f(x+h) - 8f(x-h) + f(x-2h)) / (12h)
    num = -f(x_val + 2*h) + 8*f(x_val + h) - 8*f(x_val - h) + f(x_val - 2*h)
    den = 12 * h
    return num / den

def calcular_error_relativo(x_nuevo, x_anterior):
    if abs(x_nuevo) < 1e-18: return 100.0
    return (abs(x_nuevo - x_anterior) / abs(x_nuevo)) * 100

# --- LÓGICA DE NEWTON-RAPHSON ---

def metodo_newton_raphson(f_str, x0, tol, max_iter):
    history = []
    x_n = x0
    error_p = 100.0
    
    for i in range(max_iter):
        fx = evaluar_f(f_str, x_n)
        dfx = calcular_derivada_robusta(f_str, x_n)
        
        if dfx is None or abs(dfx) < 1e-15:
            break
            
        x_next = x_n - fx / dfx
        error_p = calcular_error_relativo(x_next, x_n)
        
        history.append({
            "Iter": i + 1, "x_n": x_n, "f(x_n)": fx, 
            "f'(x_n)": dfx, "x_n+1": x_next, "Error (%)": error_p
        })
        
        if error_p < tol:
            return pd.DataFrame(history).set_index("Iter"), True, x_next, error_p
        x_n = x_next
        
    return pd.DataFrame(history).set_index("Iter"), False, x_n, error_p

# --- INTERFAZ DE USUARIO ---

col1, col2 = st.columns([1, 2])

with col1:
    st.subheader(" Entrada de Datos")
    
    # Teclado Científico
    st.write("Funciones rápidas:")
    btns = st.columns(4)
    ops = ["sin(x)", "cos(x)", "exp(x)", "log(x)", "sqrt(x)", "x^2", "pi", "("]
    
    if 'input_val' not in st.session_state:
        st.session_state.input_val = "x**2 - 2"

    for i, op in enumerate(ops):
        if btns[i % 4].button(op):
            st.session_state.input_val += op.replace("x^2", "**2")
    
    func_input = st.text_input("Función f(x) o g(x):", value=st.session_state.input_val)
    st.session_state.input_val = func_input

    x0 = st.number_input("Valor inicial (x0):", value=1.0)
    tol = st.number_input("Tolerancia (%)", value=0.001, format="%.6f")
    iters = st.slider("Iteraciones máx:", 5, 100, 20)
    
    ejecutar = st.button("Calcular Raíz")

with col2:
    if ejecutar:
        df, conv, raiz, err_f = metodo_newton_raphson(func_input, x0, tol, iters)
        
        if df is not None:
            # Métricas
            m1, m2 = st.columns(2)
            m1.metric("Raíz Detectada", f"{raiz:.8f}")
            m2.metric("Error Final", f"{err_f:.4e}%")
            
            if conv: st.success("¡Convergencia alcanzada!")
            else: st.warning("Se alcanzó el límite de iteraciones.")

            # Gráfico Plotly
            x_range = np.linspace(raiz - 2, raiz + 2, 250)
            y_range = [evaluar_f(func_input, v) for v in x_range]
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=x_range, y=y_range, name="f(x)", line=dict(color='#00cfcc')))
            
            # --- MARCAR LA RAÍZ ---
            fig.add_trace(go.Scatter(
                x=[raiz], y=[0],
                mode='markers',
                marker=dict(color='red', size=12, symbol='star'),
                name="Raíz"
            ))
            
            fig.add_hline(y=0, line_dash="dash", line_color="white")
            fig.update_layout(template="plotly_dark", title="Visualización Matemática")
            st.plotly_chart(fig, use_container_width=True)
            
            st.dataframe(df.style.format(precision=6), use_container_width=True)