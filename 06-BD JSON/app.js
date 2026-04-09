const STORAGE_KEY = "employee-db-v1";
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=200&q=80";

const form = document.getElementById("employeeForm");
const tableBody = document.getElementById("employeeTableBody");
const rowTemplate = document.getElementById("employeeRowTemplate");
const formMessage = document.getElementById("formMessage");
const employeeCounter = document.getElementById("employeeCounter");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const deleteBanner = document.getElementById("deleteBanner");
const deleteBannerText = document.getElementById("deleteBannerText");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let employees = [];
let pendingDeleteEmployeeId = null;
let editingEmployeeId = null;

initialize();

async function initialize() {
  const initialEmployees = normalizeEmployeeList(await loadFromJson());
  const localEmployees = normalizeEmployeeList(loadFromLocalStorage());

  if (initialEmployees.length === 0 && localEmployees.length > 0) {
    employees = localEmployees;
  } else if (localEmployees.length > 0) {
    employees = mergeEmployees(initialEmployees, localEmployees);
    saveToLocalStorage();
  } else {
    employees = initialEmployees;
    saveToLocalStorage();
  }

  renderTable();

  if (employees.length === 0) {
    setFormMessage(
      "No se pudo cargar employees.json. Abre la app con un servidor local (por ejemplo Live Server).",
      "error"
    );
  }
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadFromJson() {
  try {
    const response = await fetch("employees.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo leer employees.json");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function mergeEmployees(jsonEmployees, localEmployees) {
  const mergedByEmail = new Map();

  for (const employee of jsonEmployees) {
    mergedByEmail.set(employee.email.toLowerCase(), employee);
  }

  for (const employee of localEmployees) {
    // Los datos locales tienen prioridad porque representan cambios del usuario.
    mergedByEmail.set(employee.email.toLowerCase(), employee);
  }

  return Array.from(mergedByEmail.values());
}

function normalizeEmployeeList(list) {
  if (!Array.isArray(list)) return [];

  return list
    .filter((employee) => employee && typeof employee === "object")
    .filter(
      (employee) =>
        typeof employee.firstName === "string" &&
        typeof employee.lastName === "string" &&
        typeof employee.email === "string"
    )
    .map((employee) => ({
      id: employee.id || crypto.randomUUID(),
      firstName: String(employee.firstName).trim(),
      lastName: String(employee.lastName).trim(),
      email: String(employee.email).trim().toLowerCase(),
      contactNumber: String(employee.contactNumber || "").trim(),
      salary: Number(employee.salary) || 0,
      birthDate: String(employee.birthDate || "").trim(),
      imageUrl: String(employee.imageUrl || "").trim(),
    }));
}

cancelDeleteBtn.addEventListener("click", closeDeleteBanner);

confirmDeleteBtn.addEventListener("click", () => {
  if (!pendingDeleteEmployeeId) return;

  removeEmployee(pendingDeleteEmployeeId);
  closeDeleteBanner();
  setFormMessage("Empleado eliminado correctamente.", "success");
});

deleteBanner.addEventListener("click", (event) => {
  if (event.target === deleteBanner) {
    closeDeleteBanner();
  }
});

cancelEditBtn.addEventListener("click", () => {
  exitEditMode();
  setFormMessage("Edicion cancelada.", "success");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const firstName = form.firstName.value.trim();
  const lastName = form.lastName.value.trim();
  const email = form.email.value.trim().toLowerCase();
  const contactNumber = form.contactNumber.value.trim();
  const salary = Number(form.salary.value);
  const birthDate = form.birthDate.value;
  const imageUrl = form.imageUrl.value.trim();

  const validationError = validateFormData({
    firstName,
    lastName,
    email,
    contactNumber,
    salary,
    birthDate,
    imageUrl,
  });

  if (validationError) {
    setFormMessage(validationError, "error");
    return;
  }

  const duplicateEmail = employees.some(
    (employee) =>
      employee.email.toLowerCase() === email && employee.id !== editingEmployeeId
  );

  if (duplicateEmail) {
    setFormMessage("Ya existe un empleado con ese correo.", "error");
    return;
  }

  if (editingEmployeeId) {
    const employeeIndex = employees.findIndex(
      (employee) => employee.id === editingEmployeeId
    );

    if (employeeIndex === -1) {
      setFormMessage("No se encontro el empleado a editar.", "error");
      exitEditMode();
      return;
    }

    employees[employeeIndex] = {
      ...employees[employeeIndex],
      firstName,
      lastName,
      email,
      contactNumber,
      salary,
      birthDate,
      imageUrl,
    };

    saveToLocalStorage();
    renderTable();
    exitEditMode();
    setFormMessage("Empleado actualizado correctamente.", "success");
    return;
  }

  employees.push({
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email,
    contactNumber,
    salary,
    birthDate,
    imageUrl,
  });

  saveToLocalStorage();
  renderTable();
  form.reset();
  setFormMessage("Empleado agregado correctamente.", "success");
});

function validateFormData(data) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+()\-\s]{7,20}$/;

  if (!data.firstName || !data.lastName) {
    return "Nombre y apellido son obligatorios.";
  }

  if (!emailRegex.test(data.email)) {
    return "Ingresa un correo valido.";
  }

  if (!phoneRegex.test(data.contactNumber)) {
    return "Ingresa un numero de contacto valido.";
  }

  if (!Number.isFinite(data.salary) || data.salary < 0) {
    return "El salario debe ser un numero positivo.";
  }

  if (!data.birthDate) {
    return "La fecha de nacimiento es obligatoria.";
  }

  if (data.imageUrl) {
    try {
      new URL(data.imageUrl);
    } catch {
      return "La URL de imagen no es valida.";
    }
  }

  return null;
}

function renderTable() {
  tableBody.innerHTML = "";

  for (const employee of employees) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);

    const avatar = row.querySelector(".avatar");
    avatar.src = employee.imageUrl || DEFAULT_AVATAR;

    row.querySelector(".name-col").textContent =
      `${employee.firstName} ${employee.lastName}`;
    row.querySelector(".email-col").textContent = employee.email;
    row.querySelector(".phone-col").textContent = employee.contactNumber;
    row.querySelector(".salary-col").textContent = formatSalary(employee.salary);
    row.querySelector(".birth-col").textContent = formatDate(employee.birthDate);

    const editButton = row.querySelector(".btn-edit");
    editButton.addEventListener("click", () => {
      enterEditMode(employee);
    });

    const deleteButton = row.querySelector(".btn-danger");
    deleteButton.addEventListener("click", () => {
      openDeleteBanner(employee);
    });

    tableBody.appendChild(row);
  }

  updateCounter();
}

function removeEmployee(employeeId) {
  employees = employees.filter((employee) => employee.id !== employeeId);

  if (editingEmployeeId === employeeId) {
    exitEditMode();
  }

  saveToLocalStorage();
  renderTable();
}

function enterEditMode(employee) {
  editingEmployeeId = employee.id;
  form.firstName.value = employee.firstName;
  form.lastName.value = employee.lastName;
  form.email.value = employee.email;
  form.contactNumber.value = employee.contactNumber;
  form.salary.value = employee.salary;
  form.birthDate.value = employee.birthDate;
  form.imageUrl.value = employee.imageUrl;

  formTitle.textContent = "Editar empleado";
  submitBtn.textContent = "Actualizar empleado";
  cancelEditBtn.classList.remove("hidden");
  setFormMessage("Editando empleado seleccionado.", "success");
  form.firstName.focus();
}

function exitEditMode() {
  editingEmployeeId = null;
  form.reset();
  formTitle.textContent = "Agregar empleado";
  submitBtn.textContent = "Guardar empleado";
  cancelEditBtn.classList.add("hidden");
}

function openDeleteBanner(employee) {
  pendingDeleteEmployeeId = employee.id;
  deleteBannerText.textContent = `Vas a eliminar a ${employee.firstName} ${employee.lastName}. Esta accion no se puede deshacer.`;
  deleteBanner.classList.remove("hidden");
}

function closeDeleteBanner() {
  pendingDeleteEmployeeId = null;
  deleteBanner.classList.add("hidden");
}

function updateCounter() {
  const count = employees.length;
  employeeCounter.textContent = `${count} empleado${count === 1 ? "" : "s"}`;
}

function formatSalary(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function setFormMessage(message, type) {
  formMessage.textContent = message;
  formMessage.classList.remove("error", "success");

  if (type) {
    formMessage.classList.add(type);
  }
}
