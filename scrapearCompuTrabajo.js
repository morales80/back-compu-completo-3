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

  // Cambiar User-Agent para evitar detección de headless
  await pagina.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  await pagina.goto(URL, { waitUntil: "networkidle2" });

  let trabajos = [];
  let paginaActual = 1;
  const maxPaginas = 20; // Limite para evitar loops infinitos
  let btnSiguientePaginaActivo = true;
  let linksGlobales = [];

  while (btnSiguientePaginaActivo && paginaActual <= maxPaginas) {
    console.log(
      `:::::::::Página ${paginaActual} cargada. Buscando enlaces::::::`
    );

    const linksDeTrabajos = await pagina.evaluate(() =>
      Array.from(
        document.querySelectorAll("article.box_offer h2.fs18.fwB a")
      ).map((a) => a.href)
    );

    console.log(
      `:::::Se encontraron ${linksDeTrabajos.length} enlaces::::::::`
    );
    linksGlobales.push(...linksDeTrabajos);

    const haySiguiente = await pagina.evaluate(() => {
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

    if (haySiguiente) {
      try {
        await pagina.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 10000,
        });
      } catch {
        // Aquí usamos setTimeout con promesa en vez de waitForTimeout
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      paginaActual++;
    } else {
      btnSiguientePaginaActivo = false;
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

        // Selectores simplificados
        const titulo = getText("h1.fwB.fs24.mb5.box_detail.w100_m");
        const empresa = getText(
          "div.info_company.dFlex.vm_fx.mb10 div.w100 > a.dIB.fs16.js-o-link"
        );
        const ubicacion = getText("div.container > p.fs16");
        const modalidad = getText("div.mbB :last-of-type");
        const salario = getText("div.mbB :first-of-type");
        const fechaPublicacion = getText("p.fc_aux.fs13:last-of-type");
        const descripcion = getText("p.mbB");

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
      // Cambio aquí para la pausa, compatible con tu versión
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error(
        ":::::::Error accediendo al trabajo::::::::::",
        link,
        err.message
      );
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
    "resultadosCompuTrabajo.xlsx",
    outputDir,
    "trabajos"
  );

  // Devuelvo los trabajos para que se usen en el backend o lo que necesites
  return trabajos;
};
