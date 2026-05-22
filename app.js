const SUPABASE_URL =
"https://qwlxsvzhxvvdbhiwxlbb.supabase.co";

const SUPABASE_KEY =
"sb_publishable_ieNxKvgX7nTROGOmHNpBbw_GSTTJ9Os";

const client =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;

let allAppointments = [];

let config = null;

// ELEMENTOS

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

const paymentInfo =
document.getElementById(
  "payment-info"
);

// SESSION

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

// LOGIN

authForm.addEventListener(
"submit",
async function(e){

  e.preventDefault();

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  authStatus.innerHTML =
  "Conectando...";

  let result =
  await client.auth.signInWithPassword({

    email,
    password

  });

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

  openApp();

}
);

// OPEN APP

async function openApp(){

  authScreen.style.display =
  "none";

  app.style.display =
  "block";

  await loadConfig();

  loadMyAppointments();

  if(
    currentUser.email ===
    "yeraariel0@gmail.com"
  ){

    adminPanel.style.display =
    "block";

    loadAdminConfig();

    loadAllAppointments();

  }

}

// CONFIG

async function loadConfig(){

  const response =
  await client
  .from("configuracion")
  .select("*")
  .single();

  config =
  response.data;

  loadServices();

  loadSchedules();

  updatePaymentInfo();

}

function loadServices(){

  const servicio =
  document.getElementById(
    "servicio"
  );

  servicio.innerHTML = "";

  config.servicios.forEach(s => {

    servicio.innerHTML +=

    `<option>

      ${s.nombre} - ${s.precio}

    </option>`;

  });

}

function loadSchedules(){

  const horario =
  document.getElementById(
    "horario"
  );

  horario.innerHTML = "";

  config.horarios.forEach(h => {

    horario.innerHTML +=

    `<option>

      ${h}

    </option>`;

  });

}

function updatePaymentInfo(){

  const metodo =
  document.getElementById(
    "metodo-pago"
  ).value;

  if(
    metodo === "Transfermovil"
  ){

    paymentInfo.innerHTML =

    `Transferir a:<br><br>

    ${config.transfermovil}`;

  }

  else if(
    metodo === "Enzona"
  ){

    paymentInfo.innerHTML =

    `Transferir a:<br><br>

    ${config.enzona}`;

  }

  else if(
    metodo === "Saldo móvil"
  ){

    paymentInfo.innerHTML =

    `Enviar saldo a:<br><br>

    ${config.saldo_movil}`;

  }

  else{

    paymentInfo.innerHTML =

    `Pago presencial`;

  }

}

document
.getElementById("metodo-pago")
.addEventListener(
"change",
updatePaymentInfo
);

// RESERVA

bookingForm.addEventListener(
"submit",
async function(e){

  e.preventDefault();

  const codigo =
  prompt(
    "Ingrese código de confirmación"
  );

  if(!codigo){

    return;

  }

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

    fecha:
    document.getElementById(
      "fecha"
    ).value,

    horario:
    document.getElementById(
      "horario"
    ).value,

    metodo_pago:
    document.getElementById(
      "metodo-pago"
    ).value,

    codigo_confirmacion:
    codigo,

    estado:
    "Procesando"

  }]);

  if(insert.error){

    alert("Error reservando");

    return;

  }

  bookingForm.reset();

  loadMyAppointments();

  alert("Reserva enviada");

}
);

// MIS CITAS

async function loadMyAppointments(){

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

  response.data.forEach(cita => {

    let estadoClass =
    "procesando";

    if(
      cita.estado ===
      "Confirmada"
    ){

      estadoClass =
      "confirmada";

    }

    if(
      cita.estado ===
      "Cancelada"
    ){

      estadoClass =
      "cancelada";

    }

    appointmentsContainer.innerHTML +=

    `<div class="cita-card">

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

      <div class="estado ${estadoClass}">

        ${cita.estado}

      </div>

    </div>`;

  });

}

// ADMIN CITAS

async function loadAllAppointments(){

  const response =
  await client
  .from("citas")
  .select("*")
  .order("id",{ascending:false});

  allAppointments =
  response.data;

  renderAdminAppointments(
    allAppointments
  );

}

function renderAdminAppointments(data){

  adminCitas.innerHTML = "";

  data.forEach(cita => {

    let estadoClass =
    "procesando";

    if(
      cita.estado ===
      "Confirmada"
    ){

      estadoClass =
      "confirmada";

    }

    if(
      cita.estado ===
      "Cancelada"
    ){

      estadoClass =
      "cancelada";

    }

    adminCitas.innerHTML +=

    `<div class="cita-card">

      <h2>
        ${cita.cliente}
      </h2>

      <p>
        📞 ${cita.telefono}
      </p>

      <p>
        ✨ ${cita.servicio}
      </p>

      <p>
        📅 ${cita.fecha}
      </p>

      <p>
        💳 ${cita.metodo_pago}
      </p>

      <p>
        🔑 ${cita.codigo_confirmacion}
      </p>

      <div class="estado ${estadoClass}">

        ${cita.estado}

      </div>

      <br><br>

      <button onclick="updateStatus(${cita.id},'Confirmada')">

        Confirmar

      </button>

      <button onclick="updateStatus(${cita.id},'Cancelada')">

        Cancelar

      </button>

    </div>`;

  });

}

function filterAppointments(status){

  if(status === "Todas"){

    renderAdminAppointments(
      allAppointments
    );

    return;

  }

  const filtered =
  allAppointments.filter(
    c => c.estado === status
  );

  renderAdminAppointments(
    filtered
  );

}

// UPDATE STATUS

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

// ADMIN CONFIG

function loadAdminConfig(){

  document.getElementById(
    "admin-horarios"
  ).value =

  config.horarios.join("\n");

  document.getElementById(
    "admin-servicios"
  ).value =

  config.servicios.map(s =>

    `${s.nombre} - ${s.precio}`

  ).join("\n");

  document.getElementById(
    "transfermovil"
  ).value =

  config.transfermovil;

  document.getElementById(
    "enzona"
  ).value =

  config.enzona;

  document.getElementById(
    "saldo-movil"
  ).value =

  config.saldo_movil;

}

async function saveConfig(){

  const horarios =
  document.getElementById(
    "admin-horarios"
  ).value
  .split("\n");

  const servicios =
  document.getElementById(
    "admin-servicios"
  ).value
  .split("\n")
  .map(s => {

    const parts =
    s.split("-");

    return{

      nombre:
      parts[0].trim(),

      precio:
      parts[1].trim()

    };

  });

  await client
  .from("configuracion")
  .update({

    horarios,

    servicios,

    transfermovil:
    document.getElementById(
      "transfermovil"
    ).value,

    enzona:
    document.getElementById(
      "enzona"
    ).value,

    saldo_movil:
    document.getElementById(
      "saldo-movil"
    ).value

  })
  .eq("id",1);

  alert(
    "Configuración guardada"
  );

  loadConfig();

}

// LOGOUT

document
.getElementById("logout-btn")
.addEventListener(
"click",
async function(){

  await client.auth.signOut();

  location.reload();

});
