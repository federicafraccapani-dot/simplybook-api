/* login: micemore */
/* key: 047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72 */
/* secret: a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8 */
/*company: "micemore" */
/*login: "gp@micemorevents.it" */
/*password: "Micemore2026+" */

export async function onRequestGet(context) {

  const COMPANY_LOGIN = "micemore";
  const USER_LOGIN = "gp@micemorevents.it";
  const USER_PASSWORD = "Micemore2026+";
  const API_KEY = "047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72";

  const url = new URL(context.request.url);

  /* =========================
     PROVIDER AVAILABILITY API
  ========================= */

 if (url.pathname.includes("providerAvailability")) {

    // login
    const login = await fetch(
      "https://user-api.simplybook.it/login",
      {
        method: "POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          jsonrpc:"2.0",
          method:"getToken",
          params:[
            COMPANY_LOGIN,
            API_KEY
          ],
          id:1
        })
      }
    );

    const loginData = await login.json();
    const token = loginData.result;

    // lista unit/provider
    const providers = await fetch(
      "https://user-api.simplybook.it/admin/",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "X-Company-Login":COMPANY_LOGIN,
          "X-Token":token
        },
        body: JSON.stringify({
          jsonrpc:"2.0",
          method:"getUnitList",
          params:[],
          id:2
        })
      }
    );

    const providerData = await providers.json();

    const result = {};

    Object.values(providerData.result || {}).forEach(p => {

      result[p.id] = p.qty || 0;

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



















