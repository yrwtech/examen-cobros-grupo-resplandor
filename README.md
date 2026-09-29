# Control de Cobros

Demo estático con HTML, CSS, JavaScript y localStorage. Sin instalación, dependencias ni backend.

## Uso

Abre `index.html` en un navegador con almacenamiento habilitado. Para GitHub Pages, publica la raíz del repositorio desde **Settings → Pages**; no requiere compilación. El comportamiento del almacenamiento al abrir archivos locales depende del navegador: un sitio servido por HTTP/HTTPS ofrece un origen estable.

Selecciona alumno y concepto, captura un abono y pulsa **Registrar abono**. El precio se obtiene del catálogo. Cada cuenta muestra exclusivamente sus propios recibos.

## Datos y cálculos

- Catálogos fijos: 10 alumnos y 2 conceptos ($2,000 y $2,500 MXN).
- Un arreglo de recibos en la clave `resplandor.control-cobros.recibos.v1`. Cada recibo contiene `id`, `numero` (consecutivo global `REC-0001`), `alumnoId`, `conceptoId`, `fecha` (ISO con hora), `monto` (pesos) y `estatus`.
- Total abonado: suma de recibos del alumno y concepto seleccionados con estatus `VIGENTE`. Saldo: precio menos total abonado. La aritmética se realiza en centavos; los saldos no se guardan.
- Cancelar conserva el recibo y cambia su estatus a `CANCELADO`; deja de sumarse y permite volver a abonar.
- Reiniciar pide confirmación y elimina únicamente la clave de esta aplicación.

## Comprobación rápida

1. A001 + Concepto B: precio $2,500; abonar $100 → saldo $2,400.
2. Cancelar REC-0001 → abonado $0, saldo $2,500.
3. Abonar $1,000 → abonado $1,000, saldo $1,500; historial con $100 CANCELADO y $1,000 VIGENTE.
4. Cambiar a A002 + B y A001 + A: ambas cuentas deben estar vacías. Volver a A001 + B recupera los dos recibos.
5. Recargar: los recibos permanecen. Probar montos vacíos, cero, negativos y mayores al saldo; se rechazan.

## Límites

Los datos solo existen en este navegador y origen; no se sincronizan entre dispositivos y se pierden si se elimina el almacenamiento. La navegación privada puede borrarlos al cerrar. Se informa si falla la lectura o escritura. No hay autenticación ni protección frente a edición manual de localStorage. Las pestañas se actualizan entre sí, pero localStorage no ofrece transacciones para escrituras simultáneas: este demo está pensado para uso en una pestaña.
