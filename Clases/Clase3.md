# Master-Doc: Modelado, Interpolación y Derivación Numérica

## 1. La Problemática: De lo Discreto a lo Continuo
En la práctica (laboratorios, sensores de IoT, telemetría), no obtenemos funciones como $f(x) = \sin(x)$. Obtenemos una **nube de puntos** $(x, y)$. 

El desafío es que para simular o predecir, necesitamos una función continua. Aquí aparecen dos herramientas fundamentales: **Interpolación** (para valores intermedios) y **Derivación Numérica** (para entender el cambio o la aceleración del sistema).

---

## 2. Polinomio Interpolante de Lagrange
Es el método para hallar una función polinómica de grado $n$ que pase **exactamente** por $n+1$ puntos. 

### A. La Intuición de los Polinomios Base ($L_i$)
La clave de Lagrange es que no intenta resolver un sistema de ecuaciones complejo de una vez. En su lugar, construye "funciones interruptoras" llamadas **Polinomios Base de Lagrange**:

- Cada punto $x_i$ tiene su propio $L_i(x)$.
- **Comportamiento**: Cuando evalúas $L_i$ en su propio punto $x_i$, el resultado es **1**. Cuando lo evalúas en cualquier otro punto de la muestra ($x_j$), el resultado es **0**.
- **Construcción**: Se logra mediante productos de fracciones:
  $L_i(x) = \prod_{j=0, j \neq i}^{n} \frac{x - x_j}{x_i - x_j}$

### B. El Polinomio Final ($P(x)$ )
El polinomio total es simplemente la suma de los valores $y$ multiplicados por sus respectivos polinomios base:
$P(x) = y_0L_0(x) + y_1L_1(x) + ... + y_nL_n(x)$

---

## 3. Derivación Numérica (Diferencias Finitas)
Cuando solo tenemos puntos, no podemos derivar usando reglas de cálculo tradicionales. Usamos la **Serie de Taylor** truncada para aproximar la pendiente.

### A. Tipos de Diferencias
Existen tres formas de calcular la derivada, pero varían en precisión:
1. **Progresivas (Hacia adelante):** Usa el punto actual y el siguiente.
2. **Regresivas (Hacia atrás):** Usa el punto actual y el anterior.
3. **Centrales:** Usa el punto anterior y el siguiente, **ignorando el punto central** para el cálculo de la pendiente. Es la más precisa porque los errores de Taylor se cancelan parcialmente.

### B. Fórmulas de Diferencias Centrales (Para el parcial)
Asumiendo un paso constante $h$ (donde $h = x_{i+1} - x_i$):

* **Primera Derivada (Velocidad/Pendiente):**
    $f'(x_i) \approx \frac{f(x_{i+1}) - f(x_{i-1})}{2h}$
* **Segunda Derivada (Aceleración/Curvatura):**
    $f''(x_i) \approx \frac{f(x_{i+1}) - 2f(x_i) + f(x_{i-1})}{h^2}$

---

## 4. Análisis de Errores y Límites
Es vital entender por qué fallan estos modelos para responder preguntas teóricas:

1.  **Error de Truncamiento**: Ocurre porque al usar Diferencias Finitas "cortamos" la Serie de Taylor. A menor $h$ (paso más chico), menor es el error, pero aumenta el riesgo de errores de redondeo en la computadora.
2.  **Interpolación vs. Extrapolación**:
    * **Interpolación**: Estimar entre $x_0$ y $x_n$. Es seguro.
    * **Extrapolación**: Estimar fuera del rango. El polinomio de Lagrange puede dispararse a valores infinitos rápidamente (efecto de oscilación), haciendo la predicción inútil.
3.  [cite_start]**Error de Interpolación de Lagrange**: La diferencia entre la función real $f(x)$ y el polinomio interpolante $P(x)$ se conoce como error de interpolación[cite: 136]. [cite_start]Se expresa con la siguiente fórmula matemática[cite: 138]:
    $$E(x) = f(x) - P(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!} \prod_{i=0}^{n}(x - x_i)$$
    Donde:
    * $f^{(n+1)}(\xi)$: Es la derivada de orden $n+1$ de la función real, evaluada en un punto desconocido $\xi$[cite: 139].
    * $(n+1)!$: Es el factorial, que al crecer rápidamente ayuda a reducir el error a medida que se agregan más puntos[cite: 140].
    * $\prod_{i=0}^{n}(x - x_i)$: Es el producto de las distancias; el error es cero justo en los puntos de datos y mayor entre ellos[cite: 141].
    
    Como no siempre conocemos el valor exacto de $\xi$, se suele calcular una **Cota Superior de Error** usando el valor máximo posible de esa derivada ($M_{n+1}$) en el intervalo[cite: 373, 374, 376, 377]:
    $$|E(x)| \le \frac{M_{n+1}}{(n+1)!} \left| \prod_{i=0}^{n}(x - x_i) \right|$$

---

## 5. Implementación Práctica (Lógica de Código)
Para el parcial, podrías necesitar entender cómo se traduce esto a algoritmos:

```python
# Supongamos estos datos de un experimento:
x_data = [0, 1, 2]
y_data = [1, 3, 2] 

# Para calcular la derivada en el punto x=1 (índice 1):
h = 1 # porque 1-0 = 1
derivada_en_1 = (y_data[2] - y_data[0]) / (2 * h)
# Resultado: (2 - 1) / 2 = 0.5