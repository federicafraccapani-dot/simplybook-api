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
  const API_KEY = context.env.API_KEY;

  const url = new URL(context.request.url);
const providerAvailability = url.searchParams.get("providerAvailability");

if (providerAvailability) {

  const COMPANY_LOGIN = context.env.COMPANY_LOGIN;
  const USER_LOGIN = context.env.USER_LOGIN;
  const USER_PASSWORD = context.env.USER_PASSWORD;

  const SERVICE_ID = 2;
  const DATE_FROM = "2026-04-17";
  const DATE_TO = "2026-04-18";

  /* =====================
     LOGIN ADMIN API
  ===================== */

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
  const token = loginData.result;

  /* =====================
     GET CARTESIAN MATRIX
  ===================== */

  const matrix = await fetch(
    "https://user-api.simplybook.it/admin/",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "X-Company-Login": COMPANY_LOGIN,
        "X-User-Token": token
      },
      body: JSON.stringify({
        jsonrpc:"2.0",
        method:"getCartesianStartTimeMatrix",
        params:[
          DATE_FROM,
          DATE_TO,
          SERVICE_ID,
          [],
          1,
          null,
          []
        ],
        id:2
      })
    }
  );

  const matrixData = await matrix.json();

  const result = {};

  (matrixData.result || []).forEach(provider => {

    let count = 0;

    const timeslots = provider.timeslots || {};

    Object.values(timeslots).forEach(day => {
      count += day.length;
    });

    result[provider.provider_id] = count;

  });

  return new Response(
    JSON.stringify(result),
    {
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*"
      }
    }
  );

}
  
  /* =========================
     BOOKING CLIENTE
  ========================= */
  
  const clientId = parseInt(url.searchParams.get("clientId"));

  if(!clientId){
    return new Response(
      JSON.stringify({ error:"clientId missing" }),
      { headers:{ "Content-Type":"application/json" } }
    );
  }  

  // token
  const login = await fetch(
  "https://user-api.simplybook.it/login",
  {
    method: "POST",
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
  const token = loginData.result;

  // tutte le prenotazioni
  const bookings = await fetch(
  "https://user-api.simplybook.it/admin/",
  {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "X-Company-Login":COMPANY_LOGIN,
      "X-User-Token":token
    },
    body: JSON.stringify({
    jsonrpc:"2.0",
    method:"getBookings",
    params:[{
      client_id: clientId
    }],
    id:2
  })
  }
);

  const data = await bookings.json();

  const filtered = Object.values(data.result || {}).filter(
    b => parseInt(b.client_id) === clientId
  );
  
  return new Response(
    JSON.stringify(filtered),
    {
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*"
      }
    }
  );

}






























