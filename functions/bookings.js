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
const generate = url.searchParams.get("generate");

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
    [false,
    true,
    false,
    ""]
  );

  const clients = await simplybook(
    token,
    "getClientList",
    []
  );

  return json({
    services,
    clients
  });

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
   GENERATE BOOKINGS
========================= */

if(generate){

  return generateBookings(token);

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

async function generateBookings(token){

  const serviceId = 2;
  const clientId = 123;

  const providersDay1 = Array.from({length:52},(_,i)=>i+4);
  const providersDay2 = Array.from({length:55},(_,i)=>i+1);

  const baseSlots = ["09:00","10:00","11:00","12:00"];
  const offsets = [0,15,30,45];

  function addMinutes(time,minutes){

    let [h,m]=time.split(":").map(Number);

    let d=new Date(0,0,0,h,m+minutes);

    return d.toTimeString().slice(0,5);

  }

  async function createBooking(provider,date,start){

    const end = addMinutes(start,15);

    await fetch(
      "https://user-api.simplybook.it/admin/",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "X-Company-Login":process.env.COMPANY_LOGIN,
          "X-User-Token":token
        },
        body:JSON.stringify({
          jsonrpc:"2.0",
          method:"createBooking",
          params:[{
            service_id:serviceId,
            provider_id:provider,
            client_id:clientId,
            date:date,
            start_time:start,
            end_time:end
          }],
          id:3
        })
      }
    );

  }

  async function generateDay(date,reverse,providers){

    for(const provider of providers){

      const offsetIndex=(provider-1)%4;
      const offset = reverse ? offsets[3-offsetIndex] : offsets[offsetIndex];

      for(const slot of baseSlots){

        const start = addMinutes(slot,offset);

        await createBooking(provider,date,start);

      }

    }

  }

  await generateDay("2026-04-17",false,providersDay1);
  await generateDay("2026-04-18",true,providersDay2);

  return new Response("Bookings generated");

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

