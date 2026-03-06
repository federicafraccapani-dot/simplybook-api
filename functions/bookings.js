/* login: micemore */
/* key: 047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72 */
/* secret: a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8 */
/*company: "micemore" */
/*login: "gp@micemorevents.it" */
/*password: "Micemore2026+" */

export async function onRequestGet(context) {

  const url = new URL(context.request.url);
  const clientId = parseInt(url.searchParams.get("clientId"));

  if(!clientId){
    return new Response(
      JSON.stringify({ error:"clientId missing" }),
      { headers:{ "Content-Type":"application/json" } }
    );
  }

  const COMPANY_LOGIN = "micemore";
  const API_KEY = "047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72";

  // token
  const login = await fetch(
    "https://user-api.simplybook.it/login",
    {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
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

  // tutte le prenotazioni
  const bookings = await fetch(
  "https://user-api.simplybook.it",
  {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "X-Company-Login":COMPANY_LOGIN,
      "X-Token":token
    },
    body:JSON.stringify({
      jsonrpc:"2.0",
      method:"getBookings",
     params: [{
        client_id: clientId,
        order: "date_start_asc"
      }],
      id:2
    })
  }
);

  const data = await bookings.json();

  /*const filtered = Object.values(data.result || {}).filter(
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
  );*/

  return new Response(
  JSON.stringify(data),
  { headers:{ "Content-Type":"application/json" } }
);

}












