const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

/**
 * exportar un arrelo a un archivo de excel
 *  (.xlsx)
 * @param {Array<Object>} datos - Arreglo de objetos con los datos a exportar
 * @param {string} nombreArchivo - Nombre del archivo de salida (resultados.xlsx)
 * @param {string} carpetaDestino - Directorio donde se guardará el archivo (ej: ./archivosSalida)
 * @param {string} nombreHoja - Nombre de la hoja de Excel (ej: resultados)
 */

function exportarDatosExcel(
  datos,
  nombreArchivo = "resultadosD.xlsx",
  carpetaDestino = "./archivosGenerados",
  nombreHoja = "resultados"
) {
  if (!Array.isArray(datos) || datos.length === 0) {
    console.log("Los datos deben ser un arreglo no vacío");
    return;
  }

  //Asegurarse de que la carpeta exista
  if (!fs.existsSync(carpetaDestino)) {
    fs.mkdirSync(carpetaDestino, { recursive: true });
  }
  //crear ruta completa al archivo
  const rutaCompleta = path.join(carpetaDestino, nombreArchivo);

  //Crear un console log
  console.log(`::: creando el archivo ${nombreArchivo} :::`);

  const WorkSheet = XLSX.utils.json_to_sheet(datos);
  const WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(WorkBook, WorkSheet, nombreHoja);
  XLSX.writeFile(WorkBook, rutaCompleta);

  console.log(
    `::: Archivo ${nombreArchivo} creado exitosamente en ${carpetaDestino} :::`
  );
}

module.exports = exportarDatosExcel;
