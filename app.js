// =====================
// SUPABASE
// =====================

const SUPABASE_URL =
"https://qwlxsvzhxvvdbhiwxlbb.supabase.co";

const SUPABASE_KEY =
"sb_publishable_ieNxKvgX7nTROGOmHNpBbw_GSTTJ9Os";

const client =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =====================
// ELEMENTOS
// =====================

const authForm =
document.getElementById("auth-form");

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
document.getElementById("admin-panel");

const adminCitas =
document.getElementById("admin-citas");

// =====================
// USER
// =====================

let currentUser = null;

// =====================
// AUTH
// =====================

authForm.addEventListener(
"submit",
async(e)=>{

  e.preventDefault();

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  // LOGIN

  let result =
  await client.auth.signInWithPassword({
    email,
    password
  });

  // SI NO EXISTE -> REGISTER

  if(result.error){

    result =
    await client.auth.signUp({
      email,
      password
    });

  }

  if(result.error){

    authStatus.innerHTML =
    "❌ Error autenticando";

    console.error(result.error);

    return;
  }

  authStatus.innerHTML =
  "✅ Sesión iniciada";

  currentUser =
  result.data.user;

  checkAdmin();

  loadMyAppointments();

}
);

// =====================
// ADMIN
// =====================

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

// =====================
// RESERVAR
// =====================

bookingForm.addEventListener(
"submit",
async(e)=>{

  e.preventDefault();

  if(!currentUser){

    bookingStatus.innerHTML =
    "⚠️ Debes iniciar sesión";

    return;
  }

  const fecha =
  document.getElementById("fecha").value;

  const horario =
  document.getElementById("horario").value;

  // VALIDAR DIA

  const dia =
  new Date(fecha).getDay();

  // DOMINGO=0
  // LUNES=1

  if(dia === 0 || dia === 1){

    bookingStatus.innerHTML =
    "❌ Solo martes a sábado";

    return;
  }

  // VALIDAR SI EXISTE

  const { data:existing } =
  await client
  .from("citas")
  .select("*")
  .eq("fecha",fecha)
  .eq("horario",horario);

  if(existing.length > 0){

    bookingStatus.innerHTML =
    "❌ Horario ocupado";

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
    document.getElementById(
      "metodo-pago"
    ).value,

    codigo_confirmacion:
    document.getElementById(
      "codigo"
    ).value,

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
    "❌ Error reservando";

    return;
  }

  bookingStatus.innerHTML =
  "✅ Reserva enviada";

  bookingForm.reset();

  loadMyAppointments();

}
);

// =====================
// MIS CITAS
// =====================

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
        💳 ${cita.metodo_pago}
      </p>

      <p>
        📌 Estado:
        ${cita.estado}
      </p>

    </div>

    `;

  });

}

// =====================
// ADMIN CITAS
// =====================

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

      <h3>
        ${cita.cliente}
      </h3>

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

    </div>

    `;

  });

}