// Archivo principal del TP 06 (paso 3: controlador extraido)

const path = require("node:path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const {
  crearIdentificadorSolicitud,
  medirDuracion,
} = require("./middleware/solicitudes");
const {
  prepararAreaReservas,
  validarReserva,
} = require("./middleware/reservas");
const { crearServicioReservas } = require("./servicios/reservas");
const { crearControladorReservas } = require("./controladores/reservas");

const app = express();
const PUERTO = 3000;

// Semilla: las reservas con las que arranca el servidor.
const reservasIniciales = [
  {
    id: 1,
    estudiante: "Germán Nieva",
    email: "german.nieva@ejemplo.com",
    sala: "Sala Norte",
    fecha: "2026-09-22",
    turno: "Mañana",
    personas: 3,
  },
  {
    id: 2,
    estudiante: "Camila Ruiz",
    email: "camila.ruiz@ejemplo.com",
    sala: "Sala Multimedia",
    fecha: "2026-09-22",
    turno: "Tarde",
    personas: 5,
  },
  {
    id: 3,
    estudiante: "Marcos Ledesma",
    email: "marcos.ledesma@ejemplo.com",
    sala: "Sala Sur",
    fecha: "2026-09-23",
    turno: "Noche",
    personas: 2,
  },
  {
    id: 4,
    estudiante: "Paula Sosa",
    email: "paula.sosa@ejemplo.com",
    sala: "Sala Norte",
    fecha: "2026-09-24",
    turno: "Tarde",
    personas: 6,
  },
];

// Una sola instancia del servicio, compartida por todas las rutas.
const servicioReservas = crearServicioReservas(reservasIniciales);
const controladorReservas = crearControladorReservas(servicioReservas);

// ---------------------------------------------------------------
// Configuracion de vistas
// ---------------------------------------------------------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// ---------------------------------------------------------------
// Pipeline global, en este orden
// ---------------------------------------------------------------

app.use(morgan("dev")); // 1. de terceros: registra el pedido en la terminal
app.use(crearIdentificadorSolicitud()); // 2. propio: arma el ID de la solicitud
app.use(medirDuracion); // 3. propio: usa ese ID y mide cuanto tarda
app.use(expressLayouts); // 4. hace que las vistas usen el layout
app.set("layout", "layouts/main");
app.use(express.static(path.join(__dirname, "..", "public"))); // 5. archivos de public
app.use(express.urlencoded({ extended: false })); // 6. arma req.body de los formularios
app.use(express.json()); // 7. arma req.body cuando el cuerpo viene en JSON

// ---------------------------------------------------------------
// Rutas de aplicacion
// ---------------------------------------------------------------

app.get("/", controladorReservas.mostrarInicio);
app.get("/estado", controladorReservas.mostrarEstado);

// ---------------------------------------------------------------
// Router de reservas
// ---------------------------------------------------------------

const reservasRouter = express.Router();

reservasRouter.use(prepararAreaReservas);
reservasRouter.get("/", controladorReservas.listar);
// "/nueva" va antes de "/:id" para que "nueva" no se tome como un id.
reservasRouter.get("/nueva", controladorReservas.mostrarFormulario);
reservasRouter.get("/:id", controladorReservas.mostrarDetalle);
reservasRouter.post("/", validarReserva, controladorReservas.crear);

// Se monta el router. Las rutas de adentro son relativas a /reservas.
app.use("/reservas", reservasRouter);

// ---------------------------------------------------------------
// Pagina 404, al final de todo
// ---------------------------------------------------------------

app.use(function (req, res) {
  res.status(404).render("no-encontrado", {
    titulo: "Página no encontrada",
    mensaje: "La dirección solicitada no existe.",
  });
});

// ---------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------

app.listen(PUERTO, function () {
  console.log("Servidor andando en http://localhost:" + PUERTO);
  console.log("Reservas iniciales: " + servicioReservas.contar());
});
