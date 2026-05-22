const SUPABASE_URL =
"https://qwlxsvzhxvvdbhiwxlbb.supabase.co";

const SUPABASE_KEY =
"sb_publishable_ieNxKvgX7nTROGOmHNpBbw_GSTTJ9Os";

const client =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

emailjs.init(
  "AhtH_YwiVgHubSmtd"
);

const SERVICE_ID =
"service_n6faw8i";

const TEMPLATE_ID =
"template_qe0djol";

let currentUser = null;
let config = null;
let allAppointments = [];

checkSession();

async function checkSession(){

  const response =
  await client.auth.getUser();

  if(response.data.user){

    currentUser =
    response.data.user;

    openApp();

  }

}

// LOGIN

document
.getElementById("auth-form")
.addEventListener("submit", async function(e){

  e.preventDefault();

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

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

    alert(result.error.message);
    return;

  }

  currentUser =
  result.data.user;

  openApp();

});

// ABRIR APP

async function openApp(){

  document
  .getElementById("auth-screen")
  .style.display = "none";

  document
  .getElementById("app")
  .style.display = "block";

  document
  .getElementById("logged-user")
  .innerHTML =
  currentUser.email;

  if(
    currentUser.email ===
    "yeraariel0@gmail.com"
  ){

    document
    .getElementById("admin-panel")
    .style.display = "block";

  }

  await loadConfig();

  await loadMyAppointments();

  if(
    currentUser.email ===
    "yeraariel0@gmail.com"
  ){

    await loadAllAppointments();

    await loadAdminConfig();

  }

}

// CONFIG

async function loadConfig(){

  const response =
  await client
  .from("configuracion")
  .select("*")
  .single();

  config = response.data;

  loadServices();
  loadSchedules();
  updatePaymentInfo();

}

function loadServices(){

  const servicio =
  document.getElementById("servicio");

  servicio.innerHTML = "";

  config.servicios.forEach(s=>{

    servicio.innerHTML += `
      <option>
        ${s.nombre} - ${s.precio}
      </option>
    `;

  });

}

function loadSchedules(){

  const horario =
  document.getElementById("horario");

  horario.innerHTML = "";

  config.horarios.forEach(h=>{

    horario.innerHTML += `
      <option>${h}</option>
    `;

  });

}

function updatePaymentInfo(){

  const metodo =
  document
  .getElementById("metodo-pago")
  .value;

  const info =
  document.getElementById("payment-info");

  if(metodo === "Transfermovil"){

    info.innerHTML = `
      <b>Tarjeta:</b>
      ${config.transfermovil}
      <br><br>
      <b>Confirmar al:</b>
      ${config.telefono_transfermovil}
    `;

  }

  else if(metodo === "Enzona"){

    info.innerHTML = `
      <b>Tarjeta:</b>
      ${config.enzona}
      <br><br>
      <b>Confirmar al:</b>
      ${config.telefono_enzona}
    `;

  }

  else{

    info.innerHTML =
    "Pago presencial";

  }

}

document
.getElementById("metodo-pago")
.addEventListener(
  "change",
  updatePaymentInfo
);

// RESERVAR

document
.getElementById("booking-form")
.addEventListener("submit", async function(e){

  e.preventDefault();

  const codigo =
  prompt(
    "Ingrese código de confirmación"
  );

  if(!codigo) return;

  const insert =
  await client
  .from("citas")
  .insert([{

    user_id:
    currentUser.id,

    cliente:
    document.getElementById("cliente").value,

    telefono:
    document.getElementById("telefono").value,

    email:
    currentUser.email,

    servicio:
    document.getElementById("servicio").value,

    fecha:
    document.getElementById("fecha").value,

    horario:
    document.getElementById("horario").value,

    metodo_pago:
    document.getElementById("metodo-pago").value,

    codigo_confirmacion:
    codigo,

    estado:
    "Procesando"

  }]);

  if(insert.error){

    alert(insert.error.message);
    return;

  }

  alert("Cita enviada");

  document
  .getElementById("booking-form")
  .reset();

  loadMyAppointments();

  if(
    currentUser.email ===
    "yeraariel0@gmail.com"
  ){

    loadAllAppointments();

  }

});

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
  .order(
    "id",
    {ascending:false}
  );

  const container =
  document.getElementById(
    "appointments-container"
  );

  container.innerHTML = "";

  response.data.forEach(cita=>{

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

    container.innerHTML += `

      <div class="cita-card">

        <h3>${cita.servicio}</h3>

        <p>
          📅 ${cita.fecha}
        </p>

        <p>
          ⏰ ${cita.horario}
        </p>

        <div class="estado ${estadoClass}">
          ${cita.estado}
        </div>

      </div>

    `;

  });

}

// ADMIN CITAS

async function loadAllAppointments(){

  const response =
  await client
  .from("citas")
  .select("*")
  .order(
    "id",
    {ascending:false}
  );

  allAppointments =
  response.data;

  renderAdminAppointments(
    allAppointments
  );

}

function renderAdminAppointments(data){

  const admin =
  document.getElementById(
    "admin-citas"
  );

  admin.innerHTML = "";

  data.forEach(cita=>{

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

    admin.innerHTML += `

      <div class="cita-card">

        <h3>${cita.cliente}</h3>

        <p>
          📧 ${cita.email}
        </p>

        <p>
          📱 ${cita.telefono}
        </p>

        <p>
          ✨ ${cita.servicio}
        </p>

        <p>
          📅 ${cita.fecha}
        </p>

        <p>
          ⏰ ${cita.horario}
        </p>

        <div class="estado ${estadoClass}">
          ${cita.estado}
        </div>

        <br><br>

        <button
        onclick="updateStatus(
        ${cita.id},
        'Confirmada',
        '${cita.email}',
        '${cita.servicio}',
        '${cita.fecha}',
        '${cita.horario}'
        )">

          Confirmar

        </button>

        <br><br>

        <button
        onclick="updateStatus(
        ${cita.id},
        'Cancelada',
        '${cita.email}',
        '${cita.servicio}',
        '${cita.fecha}',
        '${cita.horario}'
        )">

          Cancelar

        </button>

      </div>

    `;

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
  allAppointments.filter(c=>
    c.estado === status
  );

  renderAdminAppointments(
    filtered
  );

}

// ACTUALIZAR ESTADO

async function updateStatus(
  id,
  estado,
  email,
  servicio,
  fecha,
  hora
){

  await client
  .from("citas")
  .update({estado})
  .eq("id",id);

  if(
    estado ===
    "Confirmada"
  ){

    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        servicio,
        fecha,
        hora
      }
    );

  }

  await loadAllAppointments();

  await loadMyAppointments();

  alert("Cita actualizada");

}

// ADMIN CONFIG

async function saveConfig(){

  const horarios =
  document
  .getElementById("admin-horarios")
  .value
  .split("\n");

  const servicios =
  document
  .getElementById("admin-servicios")
  .value
  .split("\n")
  .map(s=>{

    const parts =
    s.split("-");

    return {

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
    document.getElementById("transfermovil").value,

    enzona:
    document.getElementById("enzona").value,

    saldo_movil:
    document.getElementById("saldo-movil").value,

    telefono_transfermovil:
    document.getElementById("telefono-transfermovil").value,

    telefono_enzona:
    document.getElementById("telefono-enzona").value

  })
  .eq("id",1);

  alert(
    "Configuración guardada"
  );

  loadConfig();

}

async function loadAdminConfig(){

  document
  .getElementById("admin-horarios")
  .value =
  config.horarios.join("\n");

  document
  .getElementById("admin-servicios")
  .value =
  config.servicios.map(s=>
    `${s.nombre} - ${s.precio}`
  ).join("\n");

  document
  .getElementById("transfermovil")
  .value =
  config.transfermovil;

  document
  .getElementById("enzona")
  .value =
  config.enzona;

  document
  .getElementById("saldo-movil")
  .value =
  config.saldo_movil;

  document
  .getElementById("telefono-transfermovil")
  .value =
  config.telefono_transfermovil;

  document
  .getElementById("telefono-enzona")
  .value =
  config.telefono_enzona;

}

// LOGOUT

document
.getElementById("logout-btn")
.addEventListener(
  "click",
  async function(){

    await client.auth.signOut();

    location.reload();

  }
);

// EXPORTAR EXCEL

async function exportAppointmentsExcel(){

  const response =
  await client
  .from("citas")
  .select("*")
  .eq("estado","Confirmada")
  .order(
    "fecha",
    {ascending:true}
  );

  const data =
  response.data.map(c=>({

    Fecha:
    c.fecha,

    Horario:
    c.horario,

    Cliente:
    c.cliente,

    Telefono:
    c.telefono,

    Servicio:
    c.servicio

  }));

  const worksheet =
  XLSX.utils.json_to_sheet(data);

  const workbook =
  XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Citas"
  );

  XLSX.writeFile(
    workbook,
    "MayraSpa_Citas.xlsx"
  );

}

// EXPORTAR PDF

async function exportAppointmentsPDF(){

  const response =
  await client
  .from("citas")
  .select("*")
  .eq("estado","Confirmada")
  .order(
    "fecha",
    {ascending:true}
  );

  const { jsPDF } =
  window.jspdf;

  const doc =
  new jsPDF();

  doc.setFontSize(18);

  doc.text(
    "Mayra Spa - Citas",
    10,
    15
  );

  let y = 30;

  response.data.forEach(
    (cita,index)=>{

    doc.setFontSize(12);

    doc.text(
      `${index+1}. ${cita.fecha} | ${cita.horario}`,
      10,
      y
    );

    y += 7;

    doc.text(
      `Cliente: ${cita.cliente}`,
      15,
      y
    );

    y += 7;

    doc.text(
      `Telefono: ${cita.telefono}`,
      15,
      y
    );

    y += 7;

    doc.text(
      `Servicio: ${cita.servicio}`,
      15,
      y
    );

    y += 15;

    if(y > 270){

      doc.addPage();

      y = 20;

    }

  });

  doc.save(
    "MayraSpa_Citas.pdf"
  );

}
