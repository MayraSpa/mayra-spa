const SUPABASE_URL =
"https://qwlxsvzhxvvdbhiwxlbb.supabase.co";

const SUPABASE_KEY =
"sb_publishable_ieNxKvgX7nTROGOmHNpBbw_GSTTJ9Os";

const client =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// EMAILJS

emailjs.init(
  "AhtH_YwiVgHubSmtd"
);

const SERVICE_ID =
"service_n6faw8i";

const TEMPLATE_ID =
"template_qe0djol";

// TELEGRAM

const BOT_TOKEN =
"8637382666:AAFCS4IxrPtIsgRLEKdY39z3fBusDlgSqbs";

const CHAT_ID =
"999753868";

// VARIABLES

let currentUser = null;

let config = null;

let isAdmin = false;

let allAppointments = [];

// INICIAR

checkSession();

// VERIFICAR SESION

async function checkSession(){

  const response =
  await client.auth.getUser();

  if(response.data.user){

    currentUser =
    response.data.user;

    await openApp();

  }

}

// LOGIN / REGISTRO

document
.getElementById("auth-form")
.addEventListener(
  "submit",
  async function(e){

  e.preventDefault();

  const email =
  document
  .getElementById("email")
  .value;

  const password =
  document
  .getElementById("password")
  .value;

  // LOGIN

  let result =
  await client.auth.signInWithPassword({

    email,
    password

  });

  // SI NO EXISTE → REGISTRO

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

  await openApp();

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

  // ADMIN

  const adminCheck =
  await client
  .from("admins")
  .select("*")
  .eq("email",currentUser.email)
  .single();

  isAdmin =
  !!adminCheck.data;

  if(isAdmin){

    document
    .getElementById("admin-panel")
    .style.display = "block";

  }

  await loadConfig();

  await loadMyAppointments();

  if(isAdmin){

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

  config =
  response.data;

  loadServices();

  updatePaymentInfo();

}

// SERVICIOS

function loadServices(){

  const servicio =
  document
  .getElementById("servicio");

  servicio.innerHTML = "";

  config.servicios.forEach(s=>{

    servicio.innerHTML += `

      <option>

      ${s.nombre} - ${s.precio}

      </option>

    `;

  });

}

// HORARIOS

async function loadSchedules(){

  const horario =
  document
  .getElementById("horario");

  horario.innerHTML = "";

  const fecha =
  document
  .getElementById("fecha")
  .value;

  if(!fecha){

    return;

  }

  const response =
  await client
  .from("citas")
  .select("*")
  .eq("fecha",fecha)
  .neq("estado","Cancelada");

  const ocupados =
  response.data.map(c=>c.horario);

  config.horarios.forEach(h=>{

    if(!ocupados.includes(h)){

      horario.innerHTML += `
        <option>${h}</option>
      `;

    }

  });

  if(horario.innerHTML === ""){

    horario.innerHTML = `
      <option>
      No hay horarios disponibles
      </option>
    `;

  }

}

document
.getElementById("fecha")
.addEventListener(
  "change",
  loadSchedules
);

// PAGO

function updatePaymentInfo(){

  const metodo =
  document
  .getElementById("metodo-pago")
  .value;

  const info =
  document
  .getElementById("payment-info");

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

// TELEGRAM

async function sendTelegramNotification(text){

  const url =
  `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await fetch(url,{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({

      chat_id:CHAT_ID,

      text:text

    })

  });

}

// RESERVAR

document
.getElementById("booking-form")
.addEventListener(
  "submit",
  async function(e){

  e.preventDefault();

  const fecha =
  document
  .getElementById("fecha")
  .value;

  const horario =
  document
  .getElementById("horario")
  .value;

  const check =
  await client
  .from("citas")
  .select("*")
  .eq("fecha",fecha)
  .eq("horario",horario)
  .neq("estado","Cancelada");

  if(check.data.length > 0){

    alert(
      "Ese horario ya está ocupado"
    );

    loadSchedules();

    return;

  }

  const codigo =
  prompt(
    "Ingrese código de confirmación"
  );

  if(!codigo){

    return;

  }

  const cliente =
  document
  .getElementById("cliente")
  .value;

  const telefono =
  document
  .getElementById("telefono")
  .value;

  const servicio =
  document
  .getElementById("servicio")
  .value;

  const metodo =
  document
  .getElementById("metodo-pago")
  .value;

  const insert =
  await client
  .from("citas")
  .insert([{

    user_id:
    currentUser.id,

    cliente,

    telefono,

    email:
    currentUser.email,

    servicio,

    fecha,

    horario,

    metodo_pago:
    metodo,

    codigo_confirmacion:
    codigo,

    estado:
    "Procesando"

  }]);

  if(insert.error){

    alert(insert.error.message);

    return;

  }

  await sendTelegramNotification(

`📅 NUEVA CITA

👤 ${cliente}

📧 ${currentUser.email}

📱 ${telefono}

✨ ${servicio}

📅 ${fecha}

⏰ ${horario}

💳 ${metodo}

🔐 ${codigo}`

);

  alert(
    "Cita enviada correctamente"
  );

  document
  .getElementById("booking-form")
  .reset();

  document
  .getElementById("horario")
  .innerHTML = "";

  await loadMyAppointments();

  if(isAdmin){

    await loadAllAppointments();

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
  document
  .getElementById(
    "appointments-container"
  );

  container.innerHTML = "";

  response.data.forEach(cita=>{

    let estadoClass =
    "procesando";

    if(cita.estado === "Confirmada"){

      estadoClass =
      "confirmada";

    }

    if(cita.estado === "Cancelada"){

      estadoClass =
      "cancelada";

    }

    container.innerHTML += `

      <div class="cita-card">

      <h3>${cita.servicio}</h3>

      <p>📅 ${cita.fecha}</p>

      <p>⏰ ${cita.horario}</p>

      <div class="estado ${estadoClass}">
      ${cita.estado}
      </div>

      </div>

    `;

  });

}

// TODAS LAS CITAS

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

// RENDER ADMIN

function renderAdminAppointments(data){

  const admin =
  document
  .getElementById("admin-citas");

  admin.innerHTML = "";

  data.forEach(cita=>{

    let estadoClass =
    "procesando";

    if(cita.estado === "Confirmada"){

      estadoClass =
      "confirmada";

    }

    if(cita.estado === "Cancelada"){

      estadoClass =
      "cancelada";

    }

    admin.innerHTML += `

      <div class="cita-card">

      <h3>${cita.cliente}</h3>

      <p>📧 ${cita.email}</p>

      <p>📱 ${cita.telefono}</p>

      <p>✨ ${cita.servicio}</p>

      <p>📅 ${cita.fecha}</p>

      <p>⏰ ${cita.horario}</p>

      <p>💳 ${cita.metodo_pago}</p>

      <p>🔐 ${cita.codigo_confirmacion}</p>

      <div class="estado ${estadoClass}">
      ${cita.estado}
      </div>

      <br><br>

      <button onclick="updateStatus(${cita.id},'Confirmada','${cita.email}','${cita.servicio}','${cita.fecha}','${cita.horario}')">

      Confirmar

      </button>

      <br><br>

      <button onclick="updateStatus(${cita.id},'Cancelada','${cita.email}','${cita.servicio}','${cita.fecha}','${cita.horario}')">

      Cancelar

      </button>

      </div>

    `;

  });

}

// FILTROS

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

  if(estado === "Confirmada"){

    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {

        to_email:email,

        servicio,

        fecha,

        hora

      }
    );

  }

  await loadAllAppointments();

  await loadMyAppointments();

  alert(
    "Cita actualizada"
  );

}

// CONFIG ADMIN

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

  await loadConfig();

}

// CARGAR CONFIG ADMIN

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

// LIMPIAR CITAS

async function clearAppointments(){

  const confirmar =
  confirm(
    "¿Seguro que deseas borrar todas las citas?"
  );

  if(!confirmar) return;

  await client
  .from("citas")
  .delete()
  .neq("id",0);

  alert(
    "Citas eliminadas"
  );

  await loadMyAppointments();

  if(isAdmin){

    await loadAllAppointments();

  }

}

// EXPORTAR EXCEL

async function exportAppointmentsExcel(){

  const inicio =
  document.getElementById("fecha-inicio").value;

  const fin =
  document.getElementById("fecha-fin").value;

  let query =
  client
  .from("citas")
  .select("*")
  .eq("estado","Confirmada");

  if(inicio){

    query =
    query.gte("fecha",inicio);

  }

  if(fin){

    query =
    query.lte("fecha",fin);

  }

  const response =
  await query.order(
    "fecha",
    {ascending:true}
  );

  const data =
  response.data.map(c=>({

    Fecha:c.fecha,

    Horario:c.horario,

    Cliente:c.cliente,

    Telefono:c.telefono,

    Servicio:c.servicio

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

  const inicio =
  document.getElementById("fecha-inicio").value;

  const fin =
  document.getElementById("fecha-fin").value;

  let query =
  client
  .from("citas")
  .select("*")
  .eq("estado","Confirmada");

  if(inicio){

    query =
    query.gte("fecha",inicio);

  }

  if(fin){

    query =
    query.lte("fecha",fin);

  }

  const response =
  await query.order(
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

// PESTAÑAS CLIENTE

function showTab(id,btn){

document
.querySelectorAll(".tab-content")
.forEach(tab=>{

tab.classList.remove("active-tab");

});

document
.getElementById(id)
.classList.add("active-tab");

document
.querySelectorAll(".tabs .tab-btn")
.forEach(b=>{

b.classList.remove("active");

});

btn.classList.add("active");

}

// PESTAÑAS ADMIN

function showAdminTab(id,btn){

document
.querySelectorAll(".admin-content")
.forEach(tab=>{

tab.classList.remove("active-admin");

});

document
.getElementById(id)
.classList.add("active-admin");

document
.querySelectorAll(".admin-tabs .tab-btn")
.forEach(b=>{

b.classList.remove("active");

});

btn.classList.add("active");

}
