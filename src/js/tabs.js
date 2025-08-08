const tabsArray = Array.from(document.querySelectorAll(".select-tab"));
const contentArray = Array.from(document.querySelectorAll(".select-content"));

// Función para extraer el salario como número (mejor aproximación posible)
function parseSalary(salario) {
  // Extrae el número más alto del string (ej: "$10,000 - $12,000 al mes")
  if (!salario) return 0;
  let nums = salario
    .replace(/[^0-9\-]+/g, " ")
    .split("-")
    .map((s) => parseInt(s.replace(/\D/g, "")))
    .filter((x) => !isNaN(x));
  if (nums.length === 0) return 0;
  return Math.max(...nums);
}
// Card de cada trabajo
function trabajoCard(trabajo, i) {
  return `
      <div class="bg-blue-50 rounded-lg shadow p-4 mb-4 border border-blue-100 hover:shadow-lg transition max-w-xl mx-auto">
        <div class="flex items-center gap-3 mb-2">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-200 flex items-center justify-center text-blue-700 font-bold rounded-full">
            ${i !== undefined ? i + 1 : ""}
          </div>
          <div class="text-lg font-bold text-blue-800">${
            trabajo.titulo || "(Sin título)"
          }</div>
        </div>
        <div class="text-gray-700 mb-1">${
          trabajo.empresa || ""
        } <span class="text-gray-400">- ${trabajo.ubicacion || ""}</span></div>
        <div class="text-gray-500 my-1 text-sm">${
          trabajo.descripcion?.slice(0, 100) || "(Sin descripción)"
        }...</div>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded">Modalidad: ${
            trabajo.modalidad
          }</span>
          <span class="bg-green-100 text-green-700 px-2 py-1 rounded">Salario: ${
            trabajo.salario
          }</span>
          <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded">Publicado: ${
            trabajo.fechaPublicacion
          }</span>
        </div>
      </div>
    `;
}

async function cargarTabs() {
  let trabajos = [];
  try {
    const resp = await fetch("../../output/resultadosCompuTrabajo.json");
    if (!resp.ok)
      throw new Error("No se pudo cargar el JSON de resultados de trabajos.");
    trabajos = await resp.json();
  } catch (e) {
    contentArray.forEach(
      (sec) =>
        (sec.innerHTML = `<div class="text-red-500 text-lg">Error al cargar datos: ${e.message}</div>`)
    );
    return;
  }

  contentArray[0].innerHTML = trabajos.length
    ? trabajos.map(trabajoCard).join("")
    : `<div class="text-gray-500">No hay datos.</div>`;

  const mejores = [...trabajos]
    .sort((a, b) => parseSalary(b.salario) - parseSalary(a.salario))
    .slice(0, 10);
  contentArray[1].innerHTML = mejores.length
    ? mejores.map((t, i) => trabajoCard(t, i)).join("")
    : `<div class="text-gray-500">No hay datos.</div>`;

  const peores = [...trabajos]
    .sort((a, b) => parseSalary(a.salario) - parseSalary(b.salario))
    .slice(0, 10);
  contentArray[2].innerHTML = peores.length
    ? peores.map((t, i) => trabajoCard(t, i)).join("")
    : `<div class="text-gray-500">No hay datos.</div>`;
}

cargarTabs();

tabsArray.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabsArray.forEach((t) =>
      t.classList.remove("bg-blue-100", "text-blue-700", "shadow-inner")
    );
    const currentTab = tabsArray.indexOf(tab);
    contentArray.forEach((content, i) => {
      if (i === currentTab) {
        content.classList.remove("hidden");
      } else {
        content.classList.add("hidden");
      }
    });
    tab.classList.add("bg-blue-100", "text-blue-700", "shadow-inner");
  });
});
