const SUPABASE_URL =
"https://qwlxsvzhxvvdbhiwxlbb.supabase.co";

const SUPABASE_KEY =
"sb_publishable_ieNxKvgX7nTROGOmHNpBbw_GSTTJ9Os";

const client =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ======================
// ELEMENTOS
// ======================

const authForm =
document.getElementById("auth-form");

const authScreen =
document.getElementById("auth-screen");

const app =
document.getElementById("app");

const authStatus =
document.getElementById("auth-status");

const bookingForm =
document.getElementById("booking-form");

const bookingStatus =
document.getElementById("booking-status");

const appointmentsContainer =
document.getElementById(
  "appointments-container"
);

const adminPanel =
document.getElementById(
  "admin-panel"
);

const adminCitas =
document.getElementById(
  "admin-citas"
);

let currentUser = null;

// ======================
// CHECK SESSION
// ======================

async function checkSession(){

  const response =
  await client.auth.getUser();

  if(response.data.user){

    currentUser =
    response.data.user;

    openApp();

  }

}

checkSession();

// ======================
// LOGIN / REGISTER
// ======================

authForm.addEventListener(
"submit",
async function(e){

  e.preventDefault();

  const email =
  document.getElementById(
    "email"
  ).value;

  const password =
  document.getElementById(
    "password"
  ).value;

  authStatus.innerHTML =
  "Conectando...";

  // LOGIN

  let result =
  await client.auth.signInWithPassword({

    email:email,
    password:password

  });

  // SI NO EXISTE -> REGISTER

  if(result.error){

    result =
    await client.auth.signUp({

      email:email,
      password:password

    });

  }

  // ERROR

  if(result.error){

    console.log(result.error);

    authStatus.innerHTML =
    result.error.message;

    return;

  }

  // USER NULL

  if(!result.data.user){

    authStatus.innerHTML =
    "Error autenticando";

    return;

  }

  // LOGIN OK

  currentUser =
  result.data.user;

  authStatus.innerHTML =
  "✅ Bienvenido";

  openApp();

}
);

// ======================
// OPEN APP
// ======================

function openApp(){

  authScreen.classList.add(
    "hidden"
  );

  app.classList.remove(
    "hidden"
  );

  loadMyAppointments();

  checkAdmin();

}

// ======================
// LOGOUT
// ======================

document
.getElementById("logout-btn")
.addEventListener(
"click",
async function(){

  await client.auth.signOut();

  location.reload();

}
);

// ======================
// ADMIN
// ======================

function checkAdmin(){

  if(
    currentUser &&
    currentUser.email ===
    "yeraariel0@gmail.com"
  ){

    adminPanel.classList.remove(
      "hidden"
    );

    loadAllAppointments();

  }

}

// ======================
// RESERVAR
// ======================

bookingForm.addEventListener(
"submit",
async function(e){

  e.preventDefault();

  if(!currentUser){

    bookingStatus.innerHTML =
    "Debes iniciar sesión";

    return;

  }

  const metodoPago =
  document.getElementById(
    "metodo-pago"
  ).value;

  const codigo =
  prompt(
    "Ingrese código de confirmación de " +
    metodoPago
  );

  if(!codigo){

    bookingStatus.innerHTML =
    "Debes ingresar código";

    return;

  }

  const fecha =
  document.getElementById(
    "fecha"
  ).value;

  const horario =
  document.getElementById(
    "horario"
  ).value;

  // VALIDAR DIA

  const dia =
  new Date(fecha).getDay();

  // DOMINGO = 0
  // LUNES = 1

  if(dia === 0 || dia === 1){

    bookingStatus.innerHTML =
    "Solo martes a sábado";

    return;

  }

  // VALIDAR HORARIO

  const response =
  await client
  .from("citas")
  .select("*")
  .eq("fecha",fecha)
  .eq("horario",horario);

  if(
    response.data &&
    response.data.length > 0
  ){

    bookingStatus.innerHTML =
    "Horario ocupado";

    return;

  }

  // INSERTAR

  const insert =
  await client
  .from("citas")
  .insert([{

    user_id:
    currentUser.id,

    cliente:
    document.getElementById(
      "cliente"
    ).value,

    telefono:
    document.getElementById(
      "telefono"
    ).value,

    servicio:
    document.getElementById(
      "servicio"
    ).value,

    fecha:fecha,

    horario:horario,

    metodo_pago:
    metodoPago,

    codigo_confirmacion:
    codigo,

    estado:
    "Procesando"

  }]);

  if(insert.error){

    console.log(insert.error);

    bookingStatus.innerHTML =
    "Error reservando";

    return;

  }

  bookingStatus.innerHTML =
  "✅ Reserva enviada";

  bookingForm.reset();

  loadMyAppointments();

  if(
    currentUser.email ===
    "yeraariel0@gmail.com"
  ){

    loadAllAppointments();

  }

}
);

// ======================
// MIS CITAS
// ======================

async function loadMyAppointments(){

  if(!currentUser) return;

  const response =
  await client
  .from("citas")
  .select("*")
  .eq(
    "user_id",
    currentUser.id
  )
  .order("id",{ascending:false});

  appointmentsContainer.innerHTML =
  "";

  if(!response.data) return;

  response.data.forEach(function(cita){

    appointmentsContainer.innerHTML +=

    '<div class="cita-card">' +

    '<h3>' +
    cita.servicio +
    '</h3>' +

    '<p>📅 ' +
    cita.fecha +
    '</p>' +

    '<p>⏰ ' +
    cita.horario +
    '</p>' +

    '<p>💳 ' +
    cita.metodo_pago +
    '</p>' +

    '<p>📌 Estado: <b>' +
    cita.estado +
    '</b></p>' +

    '</div>';

  });

}

// ======================
// ADMIN PANEL
// ======================

async function loadAllAppointments(){

  const response =
  await client
  .from("citas")
  .select("*")
  .order("id",{ascending:false});

  adminCitas.innerHTML = "";

  if(!response.data) return;

  response.data.forEach(function(cita){

    adminCitas.innerHTML +=

    '<div class="cita-card">' +

    '<h2>' +
    cita.cliente +
    '</h2>' +

    '<p>📞 ' +
    cita.telefono +
    '</p>' +

    '<p>✨ ' +
    cita.servicio +
    '</p>' +

    '<p>📅 ' +
    cita.fecha +
    '</p>' +

    '<p>⏰ ' +
    cita.horario +
    '</p>' +

    '<p>💳 ' +
    cita.metodo_pago +
    '</p>' +

    '<p>🔑 ' +
    cita.codigo_confirmacion +
    '</p>' +

    '<p>📌 Estado: <b>' +
    cita.estado +
    '</b></p>' +

    '<br>' +

    '<button onclick="updateStatus(' +
    cita.id +
    ', \'Confirmada\')">' +

    'Confirmar' +

    '</button> ' +

    '<button onclick="updateStatus(' +
    cita.id +
    ', \'Cancelada\')">' +

    'Cancelar' +

    '</button>' +

    '</div>';

  });

}

// ======================
// UPDATE STATUS
// ======================

async function updateStatus(
id,
estado
){

  await client
  .from("citas")
  .update({

    estado:estado

  })
  .eq("id",id);

  loadAllAppointments();

}
