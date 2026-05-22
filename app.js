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

const TELEGRAM_BOT =
"8637382666:AAFCS4IxrPtIsgRLEKdY39z3fBusDlgSqbs";

const TELEGRAM_CHAT_ID =
"999753868";

let currentUser = null;

let config = null;

let allAppointments = [];

// SESSION

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
.addEventListener(
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

}
);

// OPEN APP

async function openApp(){

document.getElementById(
"auth-screen"
).style.display =
"none";

document.getElementById(
"app"
).style.display =
"block";

if(
currentUser.email ===
"yeraariel0@gmail.com"
){

document.getElementById(
"logged-user"
).innerHTML =
"👑 Administrador";

}else{

document.getElementById(
"logged-user"
).innerHTML =
"👤 " + currentUser.email;

}

await loadConfig();

await loadMyAppointments();

if(
currentUser.email ===
"yeraariel0@gmail.com"
){

document.getElementById(
"admin-panel"
).style.display =
"block";

await loadAdminConfig();

await loadAllAppointments();

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

const bloqueoHorario =
document.getElementById(
"bloqueo-turno-horario"
);

horario.innerHTML = "";

bloqueoHorario.innerHTML = "";

config.horarios.forEach(h => {

horario.innerHTML +=
`<option>${h}</option>`;

bloqueoHorario.innerHTML +=
`<option>${h}</option>`;

});

}

// PAYMENT

function updatePaymentInfo(){

const metodo =
document.getElementById(
"metodo-pago"
).value;

const paymentInfo =
document.getElementById(
"payment-info"
);

if(
metodo === "Transfermovil"
){

paymentInfo.innerHTML =

`Tarjeta:
${config.transfermovil}

<br><br>

Confirmar al:
${config.telefono_transfermovil}`;

}

else if(
metodo === "Enzona"
){

paymentInfo.innerHTML =

`Tarjeta:
${config.enzona}

<br><br>

Confirmar al:
${config.telefono_enzona}`;

}

else if(
metodo === "Saldo móvil"
){

paymentInfo.innerHTML =

`Enviar saldo a:
${config.saldo_movil}`;

}

else{

paymentInfo.innerHTML =
"Pago presencial";

}

}

document
.getElementById("metodo-pago")
.addEventListener(
"change",
updatePaymentInfo
);

// RESERVA

document
.getElementById("booking-form")
.addEventListener(
"submit",
async function(e){

e.preventDefault();

const fecha =
document.getElementById(
"fecha"
).value;

const horario =
document.getElementById(
"horario"
).value;

// BLOQUEOS

const bloqueos =
await client
.from("bloqueos")
.select("*")
.eq("fecha",fecha);

const blocked =
bloqueos.data.find(b =>

b.horario === "TODOS" ||

b.horario === horario

);

if(blocked){

alert(
"Horario no disponible"
);

return;

}

// OCUPADO

const citas =
await client
.from("citas")
.select("*")
.eq("fecha",fecha)
.eq("horario",horario);

const occupied =
citas.data.find(c =>

c.estado !== "Cancelada"

);

if(occupied){

alert(
"Horario ocupado"
);

return;

}

const codigo =
prompt(
"Ingrese código confirmación"
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

email:
currentUser.email,

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
codigo,

estado:
"Procesando"

}]);

if(insert.error){

alert(
"Error reservando"
);

return;

}

// TELEGRAM

fetch(

`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`,

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chat_id:
TELEGRAM_CHAT_ID,

text:

`💜 NUEVA CITA

👤 ${document.getElementById("cliente").value}

📅 ${fecha}

⏰ ${horario}

💳 ${document.getElementById("metodo-pago").value}

🔑 ${codigo}`

})

}

);

alert(
"Reserva enviada"
);

document.getElementById(
"booking-form"
).reset();

await loadMyAppointments();

if(
currentUser.email ===
"yeraariel0@gmail.com"
){

await loadAllAppointments();

}

}
);

// USER APPOINTMENTS

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

const container =
document.getElementById(
"appointments-container"
);

container.innerHTML = "";

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

container.innerHTML +=

`<div class="cita-card">

<h3>${cita.servicio}</h3>

<p>📅 ${cita.fecha}</p>

<p>⏰ ${cita.horario}</p>

<div class="estado ${estadoClass}">

${cita.estado}

</div>

</div>`;

});

}

// ADMIN

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

const admin =
document.getElementById(
"admin-citas"
);

admin.innerHTML = "";

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

admin.innerHTML +=

`<div class="cita-card">

<h2>${cita.cliente}</h2>

<p>📧 ${cita.email}</p>

<p>📞 ${cita.telefono}</p>

<p>✨ ${cita.servicio}</p>

<p>📅 ${cita.fecha}</p>

<p>⏰ ${cita.horario}</p>

<p>💳 ${cita.metodo_pago}</p>

<p>🔑 ${cita.codigo_confirmacion}</p>

<div class="estado ${estadoClass}">

${cita.estado}

</div>

<br><br>

<button onclick="updateStatus(${cita.id},'Confirmada','${cita.email}','${cita.servicio}','${cita.fecha}','${cita.horario}')">

Confirmar

</button>

<button onclick="updateStatus(${cita.id},'Cancelada','${cita.email}','${cita.servicio}','${cita.fecha}','${cita.horario}')">

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
estado,
email,
servicio,
fecha,
hora
){

await client
.from("citas")
.update({

estado

})
.eq("id",id);

// EMAIL

await emailjs.send(

SERVICE_ID,

TEMPLATE_ID,

{

to_email: email,

fecha: fecha,

hora: hora,

servicio: servicio

}

);

await loadAllAppointments();

await loadMyAppointments();

alert(
`Cita ${estado}`
);

}

// BLOCK DAY

async function blockFullDay(){

const fecha =
document.getElementById(
"bloqueo-fecha"
).value;

await client
.from("bloqueos")
.insert([{

fecha,

horario:"TODOS"

}]);

alert(
"Día bloqueado"
);

}

// BLOCK SHIFT

async function blockShift(){

const fecha =
document.getElementById(
"bloqueo-turno-fecha"
).value;

const horario =
document.getElementById(
"bloqueo-turno-horario"
).value;

await client
.from("bloqueos")
.insert([{

fecha,
horario

}]);

alert(
"Turno bloqueado"
);

}

// ADMIN CONFIG

async function loadAdminConfig(){

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

document.getElementById(
"telefono-transfermovil"
).value =

config.telefono_transfermovil;

document.getElementById(
"telefono-enzona"
).value =

config.telefono_enzona;

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
).value,

telefono_transfermovil:
document.getElementById(
"telefono-transfermovil"
).value,

telefono_enzona:
document.getElementById(
"telefono-enzona"
).value

})
.eq("id",1);

alert(
"Configuración guardada"
);

await loadConfig();

await loadAdminConfig();

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
