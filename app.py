import streamlit as st
import numpy as np
import plotly.graph_objects as go
import pandas as pd
import re
from scipy.misc import derivative # Nueva librería para derivadas

# Configuración de la página
st.set_page_config(page_title="Numerical Solver Pro", layout="wide")

st.title("Analizador de Métodos Numéricos")
st.markdown("---")

# --- FUNCIONES AUXILIARES ---

def evaluar_f(f_str, x_val):
    """Evalúa la función de forma segura."""
    try:
        f_str_limpia = f_str.replace("^", "**")
        f_str_limpia = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', f_str_limpia)
        # Diccionario de funciones seguras
        safe_dict = {
            "np": np, "x": x_val, "sin": np.sin, "cos": np.cos, 
            "tan": np.tan, "exp": np.exp, "log": np.log, "sqrt": np.sqrt, "pi": np.pi
        }
        return eval(f_str_limpia, {"__builtins__": None}, safe_dict)
    except Exception as e:
        return None

def calcular_derivada(f_str, x_val):
    """Usa scipy para una derivada más robusta."""
    return derivative(lambda x: evaluar_f(f_str, x), x_val, dx=1e-6)

def calcular_error_relativo(x_nuevo, x_anterior):
    if abs(x_nuevo) < 1e-18: return 100.0
    return (abs(x_nuevo - x_anterior) / abs(x_nuevo)) * 100

# --- MÉTODOS (Lógica optimizada) ---
# [Se mantienen tus funciones de métodos pero usando calcular_derivada en Newton-Raphson]

def metodo_newton_raphson(f_str, x0, tol, max_iter):
    history = []
    x_n = x0
    for i in range(max_iter):
        fx = evaluar_f(f_str, x_n)
        dfx = calcular_derivada(f_str, x_n) # Cambio a scipy
        
        if abs(dfx) < 1e-15: break
        
        x_next = x_n - fx / dfx
        error_p = calcular_error_relativo(x_next, x_n)
        
        history.append({
            "Iter": i+1, "x_n": x_n, "x_n+1": x_next, 
            "f(x_n)": fx, "Error (%)": error_p
        })
        
        if error_p < tol:
            return pd.DataFrame(history).set_index("Iter"), True, x_next, error_p
        x_n = x_next
    return pd.DataFrame(history).set_index("Iter"), False, x_n, error_p

# --- UI INTERACTIVA ---

st.sidebar.header("⚙️ Configuración")
metodo = st.sidebar.selectbox("Método", ["Newton-Raphson", "Bisección", "Punto Fijo", "Aceleración Aitken"])

col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("Entrada de Datos")
    
    # Teclado Científico para insertar funciones
    st.write("🧩 **Insertar funciones:**")
    func_cols = st.columns(4)
    funciones = ["sin(x)", "cos(x)", "exp(x)", "log(x)", "sqrt(x)", "x^2", "pi", "("]
    
    # Inicializar el estado del texto si no existe
    if 'func_text' not in st.session_state:
        st.session_state.func_text = "x**2 - 2"

    # Mostrar botones de funciones
    for i, f in enumerate(funciones):
        if func_cols[i % 4].button(f):
            st.session_state.func_text += f.replace("^", "**")

    func_input = st.text_input("Define la función:", value=st.session_state.func_text)
    st.session_state.func_text = func_input # Sincronizar

    # Parámetros según método
    if metodo == "Bisección":
        a_in = st.number_input("Extremo a", value=0.0)
        b_in = st.number_input("Extremo b", value=2.0)
    else:
        x0 = st.number_input("Punto inicial (x0)", value=1.0)
        
    tol = st.number_input("Tolerancia (%)", value=0.001, format="%.6f")
    iters = st.slider("Máximo de iteraciones", 5, 100, 20)
    
    boton = st.button("Calcular")

with col2:
    if boton:
        # Aquí llamarías a tus funciones de métodos (ejemplo con Newton)
        if metodo == "Newton-Raphson":
            df, conv, res, err_final = metodo_newton_raphson(func_input, x0, tol, iters)
        
        if df is not None:
            # Métricas superiores
            m1, m2 = st.columns(2)
            m1.metric("Raíz Aproximada", f"{res:.6f}")
            m2.metric("Error Final", f"{err_final:.2e}%", delta_color="inverse")

            # Gráfico con Plotly
            fig = go.Figure()
            # Rango dinámico para el gráfico
            x_vals = np.linspace(res - 2, res + 2, 200)
            y_vals = [evaluar_f(func_input, v) for v in x_vals]
            
            fig.add_trace(go.Scatter(x=x_vals, y=y_vals, name="f(x)", line=dict(color="#00d1b2")))
            
            # --- MARCAR LA RAÍZ ---
            fig.add_trace(go.Scatter(
                x=[res], y=[0], 
                mode='markers', 
                marker=dict(size=12, color='red', symbol='x'),
                name="Raíz encontrada"
            ))
            
            fig.update_layout(
                title=f"Visualización de la función: {func_input}",
                xaxis_title="x", yaxis_title="f(x)",
                hovermode="x unified",
                template="plotly_dark"
            )
            fig.add_hline(y=0, line_dash="dash", line_color="gray")
            
            st.plotly_chart(fig, use_container_width=True)
            
            with st.expander("Ver tabla de iteraciones detallada"):
                st.dataframe(df.style.highlight_max(axis=0, color='#1e3a8a'))