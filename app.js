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

loadMyAppointments();

if(
currentUser.email ===
"yeraariel0@gmail.com"
){

document.getElementById(
"admin-panel"
).style.display =
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

loadMyAppointments();

}
);
