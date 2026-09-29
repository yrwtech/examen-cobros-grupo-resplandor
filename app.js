"use strict";

const CLAVE_DATOS = "resplandor.control-cobros.recibos.v1";
const alumnos = [
  { id: "A001", nombre: "Ana López" },
  { id: "A002", nombre: "Carlos Pérez" },
  { id: "A003", nombre: "María Hernández" },
  { id: "A004", nombre: "José Martínez" },
  { id: "A005", nombre: "Laura García" },
  { id: "A006", nombre: "Miguel Sánchez" },
  { id: "A007", nombre: "Patricia Ramírez" },
  { id: "A008", nombre: "Fernando Torres" },
  { id: "A009", nombre: "Sofía Castillo" },
  { id: "A010", nombre: "Diego Morales" }
];
const conceptos = [
  { id: "C001", nombre: "Concepto A", precio: 2000 },
  { id: "C002", nombre: "Concepto B", precio: 2500 }
];
const elementos = Object.fromEntries([
  "alumno", "concepto", "precio", "abonado", "saldo", "formulario", "monto",
  "registrar", "ayuda-monto", "mensaje", "recibos", "cantidad", "contexto", "vacio", "reiniciar"
].map(id => [id, document.getElementById(id)]));
const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const formatoFecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "medium" });
let recibos = [];
let almacenamientoDisponible = true;

// La aritmética se hace en centavos para evitar errores con decimales.
function centavos(monto) {
  return Math.round(monto * 100);
}

function moneda(montoCentavos) {
  return formatoMoneda.format(montoCentavos / 100);
}

function mostrarMensaje(texto, tipo = "exito") {
  elementos.mensaje.textContent = texto;
  elementos.mensaje.className = `mensaje ${tipo}`;
}

function cargarRecibos() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_DATOS) || "[]");
    if (!Array.isArray(datos) || !datos.every(recibo =>
      recibo && typeof recibo.id === "string" && /^REC-\d{4,}$/.test(recibo.numero) &&
      alumnos.some(alumno => alumno.id === recibo.alumnoId) &&
      conceptos.some(concepto => concepto.id === recibo.conceptoId) &&
      Number.isFinite(recibo.monto) && recibo.monto > 0 &&
      typeof recibo.fecha === "string" && Number.isFinite(Date.parse(recibo.fecha)) &&
      ["VIGENTE", "CANCELADO"].includes(recibo.estatus)
    )) throw new Error("Datos inválidos");
    recibos = datos;
    almacenamientoDisponible = true;
    return true;
  } catch {
    almacenamientoDisponible = false;
    mostrarMensaje("No se pudieron leer los datos guardados. Habilita el almacenamiento del navegador o reinicia los datos de prueba si están dañados.", "error");
    return false;
  }
}

function guardarRecibos(nuevosRecibos) {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(nuevosRecibos));
    recibos = nuevosRecibos;
    return true;
  } catch {
    mostrarMensaje("No se pudo guardar el cambio. Revisa el espacio y los permisos de almacenamiento del navegador e inténtalo de nuevo.", "error");
    return false;
  }
}

function obtenerCuenta() {
  const alumno = alumnos.find(item => item.id === elementos.alumno.value);
  const concepto = conceptos.find(item => item.id === elementos.concepto.value);
  const historial = recibos.filter(recibo =>
    recibo.alumnoId === alumno?.id && recibo.conceptoId === concepto?.id
  );
  const abonado = historial
    .filter(recibo => recibo.estatus === "VIGENTE")
    .reduce((total, recibo) => total + centavos(recibo.monto), 0);
  const precio = concepto ? centavos(concepto.precio) : 0;
  return { alumno, concepto, historial, precio, abonado, saldo: precio - abonado };
}

function agregarCelda(fila, texto, clase = "") {
  const celda = document.createElement("td");
  celda.textContent = texto;
  celda.className = clase;
  fila.append(celda);
  return celda;
}

function mostrarHistorial(historial) {
  elementos.recibos.replaceChildren();
  for (const recibo of historial) {
    const fila = document.createElement("tr");
    agregarCelda(fila, recibo.numero);
    agregarCelda(fila, formatoFecha.format(new Date(recibo.fecha)));
    agregarCelda(fila, moneda(centavos(recibo.monto)), "numerico");
    const estado = document.createElement("span");
    estado.textContent = recibo.estatus;
    estado.className = `estado ${recibo.estatus.toLowerCase()}`;
    agregarCelda(fila, "").append(estado);
    const accion = agregarCelda(fila, "—", "accion");
    if (recibo.estatus === "VIGENTE") {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "cancelar";
      boton.textContent = "Cancelar recibo";
      boton.setAttribute("aria-label", `Cancelar recibo ${recibo.numero}`);
      boton.disabled = !almacenamientoDisponible;
      boton.addEventListener("click", () => cancelarRecibo(recibo.id));
      accion.replaceChildren(boton);
    }
    elementos.recibos.append(fila);
  }
  elementos.cantidad.textContent = `${historial.length} ${historial.length === 1 ? "recibo" : "recibos"}`;
  elementos.vacio.hidden = historial.length > 0;
}

function actualizarInterfaz() {
  const cuenta = obtenerCuenta();
  const seleccionCompleta = Boolean(cuenta.alumno && cuenta.concepto);
  elementos.precio.textContent = cuenta.concepto ? moneda(cuenta.precio) : "—";
  elementos.abonado.textContent = seleccionCompleta ? moneda(cuenta.abonado) : "—";
  elementos.saldo.textContent = seleccionCompleta ? moneda(cuenta.saldo) : "—";
  elementos.registrar.disabled = !almacenamientoDisponible || (seleccionCompleta && cuenta.saldo <= 0);
  elementos.monto.disabled = elementos.registrar.disabled;
  elementos.monto.max = seleccionCompleta ? String(cuenta.saldo / 100) : "";
  elementos["ayuda-monto"].textContent = !seleccionCompleta
    ? "Selecciona un alumno y un concepto para registrar un abono."
    : cuenta.saldo <= 0 ? "Cuenta liquidada. No hay saldo pendiente."
    : `Puedes abonar hasta ${moneda(cuenta.saldo)}.`;
  elementos.contexto.textContent = seleccionCompleta
    ? `${cuenta.alumno.id} · ${cuenta.alumno.nombre} / ${cuenta.concepto.nombre}`
    : "Selecciona un alumno y un concepto para consultar sus recibos.";
  elementos.vacio.textContent = seleccionCompleta ? "Esta cuenta aún no tiene recibos." : "El historial aparecerá aquí.";
  mostrarHistorial(cuenta.historial);
}

function registrarAbono(evento) {
  evento.preventDefault();
  if (!cargarRecibos()) return actualizarInterfaz();
  const cuenta = obtenerCuenta();
  if (!cuenta.alumno) return mostrarMensaje("Selecciona un alumno.", "error");
  if (!cuenta.concepto) return mostrarMensaje("Selecciona un concepto.", "error");
  if (cuenta.saldo <= 0) return mostrarMensaje("La cuenta ya está liquidada; no admite más abonos.", "error");
  const textoMonto = elementos.monto.value.trim();
  if (!textoMonto) return mostrarMensaje("Ingresa el monto del abono.", "error");
  const monto = Number(textoMonto);
  if (!Number.isFinite(monto) || monto <= 0) return mostrarMensaje("El monto debe ser mayor que cero.", "error");
  if (!/^\d+(\.\d{1,2})?$/.test(textoMonto)) return mostrarMensaje("Ingresa un monto con un máximo de dos decimales.", "error");
  if (centavos(monto) > cuenta.saldo) return mostrarMensaje("El abono no puede ser mayor al saldo pendiente.", "error");

  // La numeración es global; los recibos cancelados conservan su número.
  const consecutivo = recibos.reduce((maximo, recibo) => Math.max(maximo, Number(recibo.numero.slice(4))), 0) + 1;
  const recibo = {
    id: globalThis.crypto?.randomUUID?.() || `recibo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    numero: `REC-${String(consecutivo).padStart(4, "0")}`,
    alumnoId: cuenta.alumno.id,
    conceptoId: cuenta.concepto.id,
    fecha: new Date().toISOString(),
    monto: centavos(monto) / 100,
    estatus: "VIGENTE"
  };
  if (!guardarRecibos([...recibos, recibo])) return;
  elementos.monto.value = "";
  actualizarInterfaz();
  mostrarMensaje(`Abono de ${moneda(centavos(monto))} registrado. Recibo ${recibo.numero}.`);
}

function cancelarRecibo(id) {
  if (!cargarRecibos()) return actualizarInterfaz();
  const recibo = obtenerCuenta().historial.find(item => item.id === id);
  if (!recibo || recibo.estatus !== "VIGENTE") {
    actualizarInterfaz();
    return mostrarMensaje("El recibo ya está cancelado o no pertenece a la cuenta seleccionada.", "error");
  }
  const nuevosRecibos = recibos.map(item => item.id === id ? { ...item, estatus: "CANCELADO" } : item);
  if (!guardarRecibos(nuevosRecibos)) return;
  actualizarInterfaz();
  mostrarMensaje(`Recibo ${recibo.numero} cancelado. El saldo se ha actualizado.`);
}

function reiniciarDatos() {
  if (!window.confirm("¿Reiniciar los datos de prueba? Se borrarán todos los recibos de esta aplicación. Esta acción no se puede deshacer.")) return;
  try {
    localStorage.removeItem(CLAVE_DATOS);
    recibos = [];
    almacenamientoDisponible = true;
    elementos.monto.value = "";
    actualizarInterfaz();
    mostrarMensaje("Datos de prueba reiniciados.");
  } catch {
    mostrarMensaje("No se pudieron reiniciar los datos. Revisa los permisos de almacenamiento del navegador.", "error");
  }
}

for (const alumno of alumnos) {
  elementos.alumno.add(new Option(`${alumno.id} · ${alumno.nombre}`, alumno.id));
}
for (const concepto of conceptos) {
  elementos.concepto.add(new Option(`${concepto.id} · ${concepto.nombre}`, concepto.id));
}
for (const selector of [elementos.alumno, elementos.concepto]) {
  selector.addEventListener("change", () => {
    elementos.monto.value = "";
    mostrarMensaje("");
    cargarRecibos();
    actualizarInterfaz();
  });
}
elementos.formulario.addEventListener("submit", registrarAbono);
elementos.reiniciar.addEventListener("click", reiniciarDatos);
window.addEventListener("storage", evento => {
  if (evento.key === CLAVE_DATOS || evento.key === null) {
    cargarRecibos();
    actualizarInterfaz();
  }
});
cargarRecibos();
actualizarInterfaz();
