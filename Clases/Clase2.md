# Velocidad de Convergencia en Métodos Numéricos

## 1. Convergencia Lineal
El error disminuye de manera proporcional en cada iteración. Es un proceso constante y predecible, pero puede ser lento.

### Método de Bisección
**Pasos para resolver:**
1. **Definir intervalo:** Elegir $a$ y $b$ tales que $f(a) \cdot f(b) < 0$ (Teorema de Bolzano).
2. **Calcular punto medio:** $c = \frac{a + b}{2}$.
3. **Evaluar signo:**
    * Si $f(a) \cdot f(c) < 0$: La raíz está en $[a, c]$. Hacer **$b = c$**.
    * Si $f(b) \cdot f(c) < 0$: La raíz está en $[c, b]$. Hacer **$a = c$**.
4. **Criterio de parada:** Repetir desde el paso 2 hasta que $|f(c)| < \text{Tolerancia}$ o $\frac{b-a}{2} < \text{Tolerancia}$.



---

### Punto Fijo ($x = g(x)$)
**Pasos para resolver:**
1. **Transformar:** Despejar $f(x) = 0$ para obtener $x = g(x)$.
2. **Verificar convergencia:** Comprobar que $|g'(x)| < 1$ cerca de la raíz.
3. **Semilla:** Elegir un valor inicial $x_0$.
4. **Iterar:** Calcular $x_{k+1} = g(x_k)$.
5. **Criterio de parada:** Repetir hasta que $|x_{k+1} - x_k| < \text{Tolerancia}$.



---

## 2. Convergencia Cuadrática (o Superior)
La precisión se duplica (aproximadamente) en cada iteración. Ideal para alta precisión con pocos pasos.

### Newton-Raphson
**Pasos para resolver:**
1. **Preparar:** Obtener la derivada $f'(x)$.
2. **Semilla:** Elegir $x_0$ (evitar puntos donde $f'(x) = 0$).
3. **Iterar:** Aplicar la fórmula:
   $$x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}$$
4. **Criterio de parada:** Repetir hasta que $|x_{k+1} - x_k| < \text{Tolerancia}$.

---

### Aceleración de Aitken (Proceso $\Delta^2$)
Este método se usa para "acelerar" una sucesión que ya está convergiendo linealmente (como la de Punto Fijo).

### Procedimiento de Tabla (Aitken-Steffensen)
Para resolver en papel o Excel siguiendo el método del profesor:

1.  **Columna 1 ($x_n$):** Es tu punto de partida.
2.  **Columna 2 ($x_{n+1}$):** Aplicas punto fijo una vez: $g(x_n)$.
3.  **Columna 3 ($x_{n+2}$):** Aplicas punto fijo al resultado anterior: $g(x_{n+1})$.
4.  **Columna 4 ($\hat{x}$):** Aplicas la fórmula de Aitken usando las tres columnas anteriores.

**Importante:** El valor de la Columna 4 se convierte en el $x_n$ de la siguiente fila. Esto transforma un método lineal en uno de **convergencia cuadrática**.

---

## Comparativa Rápida

| Método | Tipo | ¿Usa Derivadas? | Robustez |
| :--- | :--- | :--- | :--- |
| **Bisección** | Lineal | No | **Alta** (No falla) |
| **Punto Fijo** | Lineal | No | **Media** (Depende de $g'(x)$) |
| **Newton** | Cuadrática | Sí | **Baja** (Depende de $x_0$) |
| **Aitken** | Acelerado | No | **Media** (Mejora al Punto Fijo) |

> **Nota de estudio:** Si un método de Punto Fijo **diverge** (como el que probaste antes), Aitken no podrá salvarlo. Aitken solo acelera lo que ya tiende a la raíz.