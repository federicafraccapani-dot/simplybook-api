/* login: micemore */
/* key: 047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72 */
/* secret: a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8 */
/*company: "micemore" */
/*login: "gp@micemorevents.it" */
/*password: "Micemore2026+" */

export async function onRequestGet(context) {

const COMPANY_LOGIN = context.env.COMPANY_LOGIN;
const USER_LOGIN = context.env.USER_LOGIN;
const USER_PASSWORD = context.env.USER_PASSWORD;

const url = new URL(context.request.url);

const providerAvailability = url.searchParams.get("providerAvailability");
const debug = url.searchParams.get("debug");
const clientId = url.searchParams.get("clientId");
const serviceId = url.searchParams.get("serviceId");
const providerId = url.searchParams.get("providerId");
const generate = url.searchParams.get("generate");
const rebalance = url.searchParams.get("rebalance");

/* =========================
   LOGIN
========================= */

async function getToken(){

  const login = await fetch(
    "https://user-api.simplybook.it/login",
    {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        jsonrpc:"2.0",
        method:"getUserToken",
        params:[
          COMPANY_LOGIN,
          USER_LOGIN,
          USER_PASSWORD
        ],
        id:1
      })
    }
  );

  const loginData = await login.json();
  return loginData.result;

}

async function simplybook(token,method,params){

  const res = await fetch(
    "https://user-api.simplybook.it/admin/",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "X-Company-Login":COMPANY_LOGIN,
        "X-User-Token":token
      },
      body:JSON.stringify({
        jsonrpc:"2.0",
        method:method,
        params:params,
        id:2
      })
    }
  );

  const data = await res.json();

  return data.result;

}

const token = await getToken();

/* =========================
   PROVIDER AVAILABILITY
========================= */

if(providerAvailability){

  const SERVICE_ID = 2;
  const DATE_FROM = "2026-04-17";
  const DATE_TO = "2026-04-18";

  const matrix = await simplybook(
    token,
    "getCartesianStartTimeMatrix",
    [
      DATE_FROM,
      DATE_TO,
      SERVICE_ID,
      [],
      1,
      null,
      []
    ]
  );

  const result = {};

  (matrix || []).forEach(provider => {

    const timeslots = provider.timeslots || {};

    const fri = (timeslots["2026-04-17"] || []).length;
    const sat = (timeslots["2026-04-18"] || []).length;

    result[provider.provider_id] = {
      fri,
      sat,
      total: fri + sat
    };

  });

  return json(result);

}

/* =========================
   DEBUG (SERVICES + CLIENTS)
========================= */

if(debug){

  const services = await simplybook(
    token,
    "getEventList",
    [
      false,
      true,
      false,
      ""
    ]
  );

  const clients = await simplybook(
    token,
    "getClientList",
    []
  );

  const providers = await simplybook(
    token,
    "getUnitList",
    [
      false,  // include anche nascosti
      true,   // array
      null,   // skip class filter
      ""      // nessun filtro nome
    ]
  );

  return json({
    services,
    clients,
    providers
  });

}
   

/* =========================
   GENERATE BOOKINGS
========================= */

if(generate && clientId && serviceId && providerId){
  return generateBookings(token, serviceId, clientId, providerId, COMPANY_LOGIN);
}

   /* =========================
   REBALANCE BOOKINGS
========================= */

if(rebalance && clientId && serviceId){
  return rebalanceBookings(token, COMPANY_LOGIN, clientId, serviceId);
}

/* =========================
   BOOKING PER CLIENTE
========================= */

if(clientId){

  const bookings = await simplybook(
    token,
    "getBookings",
    [{
      client_id: parseInt(clientId)
    }]
  );

  return json(bookings);

}

/* =========================
   DEFAULT
========================= */

return json({
  error:"missing parameters"
});

}

/* =========================
   GENERATE BOOKINGS
========================= */

async function generateBookings(token, serviceId, clientId, providerId, COMPANY_LOGIN){

  const provider = parseInt(providerId);
  const client = parseInt(clientId);
   const service = parseInt(serviceId);

  const baseSlots = ["09:00","10:00","11:00","12:00"];
  const offsets = [0,15,30,45];

  function addMinutes(time,minutes){
    let [h,m]=time.split(":").map(Number);
    let d=new Date(0,0,0,h,m+minutes);
    return d.toTimeString().slice(0,5);
  }

  async function createBooking(date,start){

    const end = addMinutes(start,15);

    const startTime = start + ":00";
    const endTime = end + ":00";

    const res = await fetch(
      "https://user-api.simplybook.it/admin/",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "X-Company-Login": COMPANY_LOGIN,
          "X-User-Token": token
        },
        body:JSON.stringify({
          jsonrpc:"2.0",
          method:"book",
          params:[
            service,
            provider,
            client,
            date,
            startTime,
            date,
            endTime,
            0,
            {},
            1,
            null,
            null
          ],
          id:3
        })
      }
    );

    const data = await res.json();

    if(data.error){
      console.log("BOOK ERROR",data.error);
    } else {
      console.log("BOOKED",provider,date,start);
    }

  }

  const offsetIndex=(provider-2)%4;
  const offset = offsets[offsetIndex];
  const reverseOffset = offsets[3-offsetIndex];

  /* 17 aprile */

  for(const slot of baseSlots){

    const start = addMinutes(slot,offset);

    await createBooking("2026-04-17",start);

  }

  /* 18 aprile */

  for(const slot of baseSlots){

    const start = addMinutes(slot,reverseOffset);

    await createBooking("2026-04-18",start);

  }

  return new Response(
    JSON.stringify({
      provider,
      created:8
    }),
    { headers:{ "Content-Type":"application/json" } }
  );

}

/* =========================
   REBALANCE BOOKINGS
========================= */

async function rebalanceBookings(simplybook, token, COMPANY_LOGIN, clientId, serviceId){

   console.log("REBALANCE START!");
   //return json({test:"rebalance running"});

  const client = parseInt(clientId);
  const service = parseInt(serviceId);

  const DAYS = ["2026-04-17","2026-04-18"];

  const excluded = new Set([14,40]);

  const offsets = [0,15,30,45];

  const baseHours = ["09:00","10:00","11:00","12:00"];

  function addMinutes(time,minutes){
    let [h,m]=time.split(":").map(Number);
    let d=new Date(0,0,0,h,m+minutes);
    return d.toTimeString().slice(0,5);
  }

  function expectedSlots(provider,day){

    const offsetIndex = (provider-1)%4;

    const offset = day==="2026-04-17"
      ? offsets[offsetIndex]
      : offsets[3-offsetIndex];

    const result=[];

    for(const base of baseHours){
      result.push(addMinutes(base,offset));
    }

    const extra = provider % 2 === 0;

    if((day==="2026-04-17" && extra) ||
       (day==="2026-04-18" && !extra)){

      result.push(addMinutes("09:30",offset));

    }

    return result;

  }

  /* =========================
     LEGGI BOOKING
  ========================= */

  const allBookings = await simplybook(
    token,
    "getBookings",
    [{ client_id: client }]
  );

  const bookings = allBookings
    .filter(b => String(b.event_id) === String(service))
    .filter(b => !excluded.has(parseInt(b.unit_id)));

  /* =========================
     ORGANIZZA PER PROVIDER
  ========================= */

  const byProvider = {};

  for(const b of bookings){

    const provider = parseInt(b.unit_id);

    if(!byProvider[provider]){
      byProvider[provider] = [];
    }

    byProvider[provider].push(b);

  }

  const actions = [];

  /* =========================
     CONTROLLO SLOT
  ========================= */

  for(const provider in byProvider){

    const providerBookings = byProvider[provider];

    for(const day of DAYS){

      const expected = expectedSlots(parseInt(provider),day);

      const current = providerBookings
        .filter(b => b.start_date.startsWith(day))
        .map(b => b.start_date.substring(11,16));

      /* slot mancanti */

      for(const slot of expected){

        if(!current.includes(slot)){

          actions.push({
            type:"create",
            provider:parseInt(provider),
            day,
            slot
          });

        }

      }

      /* slot errati */

      for(const b of providerBookings.filter(x => x.start_date.startsWith(day))){

        const time = b.start_date.substring(11,16);

        if(!expected.includes(time)){

          actions.push({
            type:"move",
            booking:b.id,
            provider:parseInt(provider),
            day,
            current:time,
            expected
          });

        }

      }

    }

  }

  return json({
    client,
    service,
    bookings:bookings.length,
    providers:Object.keys(byProvider).length,
    actions
  });

}

/* =========================
   JSON RESPONSE
========================= */

function json(data){

  return new Response(
    JSON.stringify(data,null,2),
    {
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*"
      }
    }
  );

}






