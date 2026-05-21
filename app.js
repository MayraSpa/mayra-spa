// ======================
// SUPABASE
// ======================

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

const authStatus =
document.getElementById("auth-status");

const authScreen =
document.getElementById("auth-screen");

const app =
document.getElementById("app");

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

// ======================
// USER
// ======================

let currentUser = null;

// ======================
// SESION
// ======================

checkSession();

async function checkSession(){

  const {
    data
  } =
  await client.auth.getUser();

  if(data.user){

    currentUser =
    data.user;

    openApp();

  }

}

// ======================
// LOGIN / REGISTER
// ======================

authForm.addEventListener(
"submit",
async(e)=>{

  e.preventDefault();

  const email =
  document.getElementById(
    "email"
  ).value;

  const password =
  document.getElementById(
    "password"
  ).value;

  // LOGIN

  let result =
  await client.auth.signInWithPassword({
    email,
    password
  });

  // REGISTER

  if(result.error){

    result =
    await client.auth.signUp({
      email,
      password
    });

  }

  if(result.error){

    authStatus.innerHTML =
    result.error.message;

    return;

  }

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
async()=>{

  await client.auth.signOut();

  location.reload();

}
);

// ======================
// ADMIN
// ======================

function checkAdmin(){

  if(
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
async(e)=>{

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
    `Ingrese código de confirmación de ${metodoPago}`
  );

  if(!codigo){

    bookingStatus.innerHTML =
    "Debes ingresar el código";

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

  if(dia === 0 || dia === 1){

    bookingStatus.innerHTML =
    "Solo martes a sábado";

    return;

  }

  // VALIDAR HORARIO

  const {
    data:existing
  } =
  await client
  .from("citas")
  .select("*")
  .eq("fecha",fecha)
  .eq("horario",horario);

  if(existing.length > 0){

    bookingStatus.innerHTML =
    "Horario ocupado";

    return;

  }

  // INSERTAR

  const payload = {

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

    fecha,

    horario,

    metodo_pago:
    metodoPago,

    codigo_confirmacion:
    codigo,

    estado:
    "Procesando"

  };

  const { error } =
  await client
  .from("citas")
  .insert([payload]);

  if(error){

    console.error(error);

    bookingStatus.innerHTML =
    "Error reservando";

    return;

  }

  bookingStatus.innerHTML =
  "✅ Cita enviada";

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

  const { data } =
  await client
  .from("citas")
  .select("*")
  .eq("user_id",currentUser.id)
  .order("id",{ascending:false});

  appointmentsContainer.innerHTML =
  "";

  data.forEach(cita=>{

    appointmentsContainer.innerHTML += `

    <div class="cita-card">

      <h3>
        ${cita.servicio}
      </h3>

      <p>
        📅 ${cita.fecha}
      </p>

      <p>
        ⏰ ${cita.horario}
      </p>

      <p>
        Estado:
        ${cita.estado}
      </p>

    </div>

    `;

  });

}

// ======================
// ADMIN PANEL
// ======================

async function loadAllAppointments(){

  const { data } =
  await client
  .from("citas")
  .select("*")
  .order("id",{ascending:false});

  adminCitas.innerHTML = "";

  data.forEach(cita=>{

    adminCitas.innerHTML += `

    <div class="cita-card">

      <h2>
        ${cita.cliente}
      </h2>

      <p>
        ${cita.telefono}
      </p>

      <p>
        ${cita.servicio}
      </p>

      <p>
        ${cita.fecha}
      </p>

      <p>
        ${cita.horario}
      </p>

      <p>
        ${cita.metodo_pago}
      </p>

      <p>
        Código:
        ${cita.codigo_confirmacion}
      </p>

      <p>
        Estado:
        ${cita.estado}
      </p>

      <br>

      <button
        onclick="updateStatus(
          ${cita.id},
          'Confirmada'
        )"
      >
        Confirmar
      </button>

      <button
        onclick="updateStatus(
          ${cita.id},
          'Cancelada'
        )"
      >
        Cancelar
      </button>

    </div>

    `;

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
    estado
  })
  .eq("id",id);

  loadAllAppointments();

}
