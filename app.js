// PEGA AQUÍ TU app.js ACTUAL COMPLETO
// Y AL FINAL AGREGA ESTO:

// EXPORTAR EXCEL

async function exportAppointmentsExcel(){

const response =
await client
.from("citas")
.select("*")
.eq("estado","Confirmada")
.order("fecha",{ascending:true});

if(!response.data.length){

alert(
"No hay citas confirmadas"
);

return;

}

const data =
response.data.map(c => ({

Fecha:
c.fecha,

Horario:
c.horario,

Cliente:
c.cliente,

Telefono:
c.telefono,

Servicio:
c.servicio,

MetodoPago:
c.metodo_pago

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
.order("fecha",{ascending:true});

if(!response.data.length){

alert(
"No hay citas confirmadas"
);

return;

}

const { jsPDF } =
window.jspdf;

const doc =
new jsPDF();

doc.setFontSize(18);

doc.text(

"Mayra Spa - Citas Confirmadas",

10,
15

);

let y = 30;

response.data.forEach((cita,index)=>{

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

y += 12;

if(y > 270){

doc.addPage();

y = 20;

}

});

doc.save(
"MayraSpa_Citas.pdf"
);
}
