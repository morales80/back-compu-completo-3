const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

// Usa la ruta correcta a tu módulo para exportar Excel (igual que antes)
const exportarExcel = require("./src/js/exportarExcel");

module.exports = async function scrapearCompuTrabajo(elementoABuscar) {
  const URL = `https://mx.computrabajo.com/trabajo-de-${encodeURIComponent(
    elementoABuscar
  )}`;
  console.log(
    `:::::: Iniciando búsqueda para scrapear: ${elementoABuscar} ::::::`
  );

  const navegador = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const pagina = await navegador.newPage();
  await pagina.goto(URL, { waitUntil: "networkidle2" });

  let trabajos = [];
  let paginaActual = 1;
  let btnSiguientePaginaActivo = true;
  let linksGlobales = [];

  while (btnSiguientePaginaActivo) {
    console.log(
      `:::::::::Página ${paginaActual} cargada. Buscando enlaces::::::`
    );

    const linksDeTrabajos = await pagina.evaluate(() => {
      return Array.from(
        document.querySelectorAll("article.box_offer h2.fs18.fwB a")
      ).map((a) => a.href);
    });

    console.log(
      `:::::Se encontraron ${linksDeTrabajos.length} enlaces::::::::`
    );
    linksGlobales.push(...linksDeTrabajos);

    // Buscar y hacer click en botón siguiente, controlar paginación
    btnSiguientePaginaActivo = await pagina.evaluate(() => {
      const btnSiguiente = Array.from(
        document.querySelectorAll("span.b_primary.w48.buildLink.cp")
      ).find((btn) => btn.getAttribute("title") === "Siguiente");
      if (
        btnSiguiente &&
        !btnSiguiente.classList.contains("s-pagination-disabled")
      ) {
        btnSiguiente.click();
        return true;
      }
      return false;
    });

    if (btnSiguientePaginaActivo) {
      paginaActual++;
      // Esperar un tiempo razonable para que cargue la siguiente página
      await pagina.waitForTimeout(1500);
    }
  }

  for (const [ofertaA, link] of linksGlobales.entries()) {
    try {
      console.log(
        `::::::Abriendo oferta ${ofertaA + 1} de ${linksGlobales.length}:::::`
      );
      await pagina.goto(link, { waitUntil: "networkidle2", timeout: 30000 });

      const datosTrabajo = await pagina.evaluate(() => {
        const getText = (selector) =>
          document.querySelector(selector)?.innerText.trim() || "No disponible";

        const titulo = getText(
          "body>main.detail_fs>div.container>h1.fwB.fs24.mb5.box_detail.w100_m"
        );
        const empresa = getText(
          "body>main.detail_fs>div.box_border.menu_top.dFlex>div.container>div.fr.pt10.box_resume.hide_m>div.box_border>div.info_company.dFlex.vm_fx.mb10>div.w100>a.dIB.fs16.js-o-link"
        );
        const ubicacion = getText("body>main.detail_fs>div.container>p.fs16");
        const modalidad = getText(
          "body>main.detail_fs>div.box_border.menu_top.dFlex>div.container>div.box_detail.fl.w100_m>div.mb40.pb40.bb1>div.mbB>:last-of-type"
        );
        const salario = getText(
          "body>main.detail_fs>div.box_border.menu_top.dFlex>div.container>div.box_detail.fl.w100_m>div.mb40.pb40.bb1>div.mbB>:first-of-type"
        );
        const fechaPublicacion = getText(
          "body>main.detail_fs>div.box_border.menu_top.dFlex>div.container>div.box_detail.fl.w100_m>div.mb40.pb40.bb1>p.fc_aux.fs13:last-of-type"
        );
        const descripcion = getText(
          "body>main.detail_fs>div.box_border.menu_top.dFlex>div.container>div.box_detail.fl.w100_m>div.mb40.pb40.bb1>p.mbB"
        );

        return {
          titulo,
          empresa,
          ubicacion,
          modalidad,
          salario,
          fechaPublicacion,
          descripcion,
        };
      });

      trabajos.push(datosTrabajo);
      await pagina.waitForTimeout(500);
    } catch (err) {
      console.error(
        ":::::::Error accediendo al trabajo::::::::::",
        link,
        err.message
      );
      // Puedes guardar errores por si quieres debug después
      trabajos.push({
        error: true,
        link,
        mensaje: err.message,
      });
    }
  }

  await navegador.close();

  // Directorio para resultados
  const outputDir = "./output";
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Campos para CSV
  const fields = [
    "titulo",
    "empresa",
    "ubicacion",
    "modalidad",
    "salario",
    "fechaPublicacion",
    "descripcion",
  ];

  // Guardar CSV
  try {
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(trabajos);
    fs.writeFileSync(
      path.join(outputDir, "resultadosCompuTrabajo.csv"),
      csv,
      "utf-8"
    );
    console.log("::: Archivo CSV creado exitosamente :::");
  } catch (err) {
    console.error("Error al crear archivo CSV:", err);
  }

  // Guardar JSON
  try {
    fs.writeFileSync(
      path.join(outputDir, "resultadosCompuTrabajo.json"),
      JSON.stringify(trabajos, null, 2),
      "utf-8"
    );
    console.log("::: Archivo JSON creado exitosamente :::");
  } catch (err) {
    console.error("Error al crear archivo JSON:", err);
  }

  // Guardar Excel
  await exportarExcel(
    trabajos,
    "resultadosCompuTrabajo.xlsx", // Nombre archivo Excel que quieras
    outputDir, // Carpeta destino
    "trabajos" // Nombre de hoja
  );

  // Devuelvo los trabajos para que se usen en el backend o lo que necesites
  return trabajos;
};
