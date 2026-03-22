class Tarea {
  constructor(id, descripcion, fechaLimite = null, estado = "pendiente", fechaCreacion = new Date().toLocaleString()) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.fechaLimite = fechaLimite;
    this.eliminada = false;
  }

  cambiarEstado() {
    this.estado = this.estado === "pendiente" ? "completada" : "pendiente";
  }

  eliminar() {
    this.eliminada = true;
  }

  editarDescripcion(nuevaDescripcion) {
    this.descripcion = nuevaDescripcion;
  }
}

class GestorTareas {
  constructor() {
    this.tareas = [];
  }

  agregarTarea(tarea) {
    this.tareas = [...this.tareas, tarea];
    this.guardarEnLocalStorage();
  }

  obtenerTareaPorId(id) {
    return this.tareas.find((tarea) => tarea.id === id);
  }

  editarTarea(id, nuevaDescripcion) {
    const tarea = this.obtenerTareaPorId(id);
    if (tarea) {
      tarea.editarDescripcion(nuevaDescripcion);
      this.guardarEnLocalStorage();
    }
  }

  cambiarEstadoTarea(id) {
    const tarea = this.obtenerTareaPorId(id);
    if (tarea) {
      tarea.cambiarEstado();
      this.guardarEnLocalStorage();
    }
  }

  eliminarTarea(id) {
    const tarea = this.obtenerTareaPorId(id);
    if (tarea) {
      tarea.eliminar();
      this.tareas = this.tareas.filter((item) => !item.eliminada);
      this.guardarEnLocalStorage();
    }
  }

  guardarEnLocalStorage() {
    localStorage.setItem("tareas", JSON.stringify(this.tareas));
  }

  cargarDesdeLocalStorage() {
    const tareasGuardadas = JSON.parse(localStorage.getItem("tareas")) || [];

    this.tareas = tareasGuardadas.map(({ id, descripcion, fechaLimite, estado, fechaCreacion }) => {
      return new Tarea(id, descripcion, fechaLimite, estado, fechaCreacion);
    });
  }
}

const gestor = new GestorTareas();
gestor.cargarDesdeLocalStorage();

const taskForm = document.getElementById("taskForm");
const descriptionInput = document.getElementById("description");
const deadlineInput = document.getElementById("deadline");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");
const message = document.getElementById("message");
const apiMessage = document.getElementById("apiMessage");
const loadApiTasksBtn = document.getElementById("loadApiTasksBtn");
const saveApiTasksBtn = document.getElementById("saveApiTasksBtn");

const intervalos = {};

const mostrarMensaje = (texto, destino = message) => {
  destino.textContent = texto;
  setTimeout(() => {
    destino.textContent = "";
  }, 2000);
};

function crearElementoTarea(tarea) {
  const li = document.createElement("li");
  li.classList.add("task-item");

  if (tarea.estado === "completada") {
    li.classList.add("completed");
  }

  li.innerHTML = `
    <strong>${tarea.descripcion}</strong>
    <p>Estado: ${tarea.estado}</p>
    <p>Creada: ${tarea.fechaCreacion}</p>
    <p>Fecha límite: ${tarea.fechaLimite ? new Date(tarea.fechaLimite).toLocaleString() : "No definida"}</p>
    <div class="countdown" id="countdown-${tarea.id}"></div>
    <div class="task-actions">
      <button class="toggle-btn" data-id="${tarea.id}">Cambiar estado</button>
      <button class="edit-btn" data-id="${tarea.id}">Editar</button>
      <button class="delete-btn" data-id="${tarea.id}">Eliminar</button>
    </div>
  `;

  li.addEventListener("mouseover", () => {
    li.style.backgroundColor = "#eef6ff";
  });

  li.addEventListener("mouseout", () => {
    li.style.backgroundColor = tarea.estado === "completada" ? "#dff0d8" : "#fafafa";
  });

  return li;
}

function actualizarContador(tarea) {
  const countdown = document.getElementById(`countdown-${tarea.id}`);
  if (!countdown || !tarea.fechaLimite) return;

  const actualizar = () => {
    const ahora = new Date().getTime();
    const limite = new Date(tarea.fechaLimite).getTime();
    const diferencia = limite - ahora;

    if (diferencia <= 0) {
      countdown.textContent = "Tiempo vencido";
      clearInterval(intervalos[tarea.id]);
      return;
    }

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    countdown.textContent = `Tiempo restante: ${horas}h ${minutos}m ${segundos}s`;
  };

  actualizar();

  if (intervalos[tarea.id]) {
    clearInterval(intervalos[tarea.id]);
  }

  intervalos[tarea.id] = setInterval(actualizar, 1000);
}

function renderizarTareas(filtro = "") {
  taskList.innerHTML = "";

  const tareasFiltradas = gestor.tareas.filter((tarea) =>
    tarea.descripcion.toLowerCase().includes(filtro.toLowerCase())
  );

  tareasFiltradas.forEach((tarea) => {
    const elemento = crearElementoTarea(tarea);
    taskList.appendChild(elemento);
    actualizarContador(tarea);
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const descripcion = descriptionInput.value.trim();
  const fechaLimite = deadlineInput.value || null;

  if (!descripcion) {
    mostrarMensaje("La descripción no puede estar vacía.");
    return;
  }

  setTimeout(() => {
    const nuevaTarea = new Tarea(Date.now(), descripcion, fechaLimite);
    gestor.agregarTarea(nuevaTarea);
    renderizarTareas(searchInput.value);
    mostrarMensaje("Tarea agregada correctamente.");
    taskForm.reset();
  }, 1000);
});

taskList.addEventListener("click", (event) => {
  const id = Number(event.target.dataset.id);

  if (event.target.classList.contains("toggle-btn")) {
    gestor.cambiarEstadoTarea(id);
    renderizarTareas(searchInput.value);
    mostrarMensaje("Estado actualizado.");
  }

  if (event.target.classList.contains("edit-btn")) {
    const nuevaDescripcion = prompt("Ingrese la nueva descripción:");
    if (nuevaDescripcion && nuevaDescripcion.trim() !== "") {
      gestor.editarTarea(id, nuevaDescripcion.trim());
      renderizarTareas(searchInput.value);
      mostrarMensaje("Tarea editada.");
    }
  }

  if (event.target.classList.contains("delete-btn")) {
    gestor.eliminarTarea(id);
    renderizarTareas(searchInput.value);
    mostrarMensaje("Tarea eliminada.");
  }
});

searchInput.addEventListener("keyup", () => {
  renderizarTareas(searchInput.value);
});

async function cargarTareasDesdeAPI() {
  try {
    apiMessage.textContent = "Cargando tareas desde API...";

    const respuesta = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=3");

    if (!respuesta.ok) {
      throw new Error("No fue posible obtener tareas desde la API.");
    }

    const datos = await respuesta.json();

    datos.forEach(({ id, title, completed }) => {
      const existe = gestor.tareas.some((tarea) => tarea.id === id);

      if (!existe) {
        const tarea = new Tarea(
          id,
          title,
          null,
          completed ? "completada" : "pendiente"
        );
        gestor.agregarTarea(tarea);
      }
    });

    renderizarTareas(searchInput.value);
    mostrarMensaje("Tareas cargadas desde API.", apiMessage);
  } catch (error) {
    apiMessage.textContent = `Error: ${error.message}`;
  }
}

async function guardarTareaEnAPI() {
  try {
    apiMessage.textContent = "Guardando tarea en API...";

    const tareaEjemplo = {
      userId: 1,
      title: "Tarea enviada desde TaskFlow",
      completed: false
    };

    const respuesta = await fetch("https://jsonplaceholder.typicode.com/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tareaEjemplo)
    });

    if (!respuesta.ok) {
      throw new Error("No fue posible guardar la tarea en la API.");
    }

    const resultado = await respuesta.json();
    apiMessage.textContent = `Tarea enviada correctamente a la API con id ${resultado.id}.`;
  } catch (error) {
    apiMessage.textContent = `Error: ${error.message}`;
  }
}

loadApiTasksBtn.addEventListener("click", cargarTareasDesdeAPI);
saveApiTasksBtn.addEventListener("click", guardarTareaEnAPI);

renderizarTareas();