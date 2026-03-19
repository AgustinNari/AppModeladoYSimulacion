# Clase 1: Introducción al Modelado y Métodos Numéricos

## 1. Conceptos Fundamentales

### Teoria del Caos
Establece que pequeños cambios en las condiciones iniciales de un sistema pueden generar comportamientos impredecibles a largo plazo[cite: 1].

### Modelado y Simulación
* **Modelado:** Es la representación simplificada de un sistema real para entenderlo y analizarlo[cite: 1]. Consiste en traducir la realidad al lenguaje matemático mediante un conjunto de ecuaciones o reglas[cite: 1].
    * **Proceso:** Identificar el sistema, definir variables y crear ecuaciones descriptivas[cite: 1].
    * **Ejemplo:** Crecimiento poblacional donde $\frac{dP}{dt} = rP$ (la población crece proporcionalmente a su tamaño actual)[cite: 1].
* **Simulación:** Proceso de ejecutar o correr el modelo matemático en el tiempo para observar su comportamiento bajo diversas condiciones, usualmente mediante computadoras[cite: 1].

---

## 2. Iteración y Convergencia

* **Iterar:** Repetir un proceso sistemáticamente para aproximarse a un resultado deseado[cite: 1].
* **Convergencia:** Indica cómo las aproximaciones sucesivas se acercan a la solución esperada, denominada punto $x^*$[cite: 1].
* **Velocidad de Convergencia:** Rapidez con la que se reduce el error $e = x - x^*$[cite: 1].
* **Orden de Convergencia ($p$):** Medida de la rapidez de una secuencia iterativa. Un valor de $p$ más alto implica una convergencia más veloz[cite: 1].

### Medición del Error
Para validar los resultados, se utilizan los siguientes criterios de aceptación:

* **Error Absoluto:** $E_{abs} \approx |x_{n+1} - x_n|$[cite: 1].
    * **Criterio:** $\leq 10^{-3}$[cite: 1].
* **Error Relativo:** $E_{rel} \approx \frac{|x_{n+1} - x_n|}{|x_{n+1}|}$[cite: 1].
    * **Criterio:** $\leq 1\%$ (se multiplica el resultado por 100)[cite: 1].

---

## 3. Espacios Métricos: Conjuntos Compactos
En un espacio métrico, un conjunto $k$ es compacto si cumple dos condiciones[cite: 1]:
1. **Cerrado:** Contiene todos sus puntos límite e incluye sus bordes[cite: 1].
2. **Acotado:** Todos sus puntos están a una distancia finita de un punto fijo (no se extiende al infinito)[cite: 1].

---

## 4. Métodos para Hallar Raíces

### Método de Bisección
Requiere los límites $a$ y $b$ de una función continua[cite: 1].
* **Condición necesaria:** $f(a) \cdot f(b) < 0$ (cambio de signo en el intervalo)[cite: 1].
* **Procedimiento:** Calcular el punto medio $c = \frac{a+b}{2}$. Se actualizan los límites según el signo de $f(c)$ para achicar el intervalo hasta que $f(c) = 0$ o se alcance la tolerancia[cite: 1].



### Punto Fijo
Se busca el punto donde $f(x^*) = x^*$ mediante una función auxiliar iterativa $g(x)$[cite: 1].
* **Condición de Lipschitz:** Para asegurar la convergencia, se debe cumplir que $|g'(x_0)| < 1$ en el punto semilla $x_0$[cite: 1].
* **Comportamiento según la pendiente ($g'$):**

| Valor de la pendiente ($g'$) | Comportamiento |
| :--- | :--- |
| $g' < -1$ | Diverge de forma espiral[cite: 1] |
| $-1 < g' < 0$ | Converge de forma espiral[cite: 1] |
| $0 < g' < 1$ | Converge de forma escalonada[cite: 1] |
| $g' > 1$ | Diverge de forma escalonada[cite: 1] |

**Pasos:**
1. Partir de $f(x) = 0$[cite: 1].
2. Rearmar la función como $g(x) = x$ verificando la condición de convergencia[cite: 1].