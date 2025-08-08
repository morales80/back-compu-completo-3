//IMPORTAR EL MODULO DE BÚSQUEDA
const readline = require("readline");
const { resolve } = require("path");

//CREAR UNA INTERFAZ DE LÍNEA DE COMANDOS
function preguntarElemento() {
  return new Promise((resolve) => {
    //paso 1. primero crea una interfaz de lectura con readline
    //el input lee desde la consola
    //el output muestra el texto desde la consola
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    //funcion auxiliar para hacer la pregunta de forma recursiva en la entrada es invalido

    function hacerPregunta() {
      rl.question(
        "¿Qué propuesta de trabajo quieres buscar en compuTrabajo? ",
        (respuesta) => {
          const ArgumentoDeBusqueda = respuesta.trim();

          if (ArgumentoDeBusqueda === "" || ArgumentoDeBusqueda.length < 3) {
            console.log(
              "Entrada invalida. No puede estar vacio o contener solo espacios, debe tener almenos 3 caracteres.\n"
            );
            hacerPregunta(); // Volver a preguntar si la entrada es inválida
          } else {
            //si la entrada es valida, cierra la interfaz de lectura
            rl.close();
            resolve(ArgumentoDeBusqueda); // Resuelve la promesa con el argumento de búsqueda
          }
        }
      );
    }
    hacerPregunta();
  });
}

module.exports = preguntarElemento;
