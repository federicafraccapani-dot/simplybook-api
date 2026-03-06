/* login: micemore */
/* key: 047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72 */
/* secret: a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8 */
/*company: "micemore" */
/*login: "gp@micemorevents.it" */
/*password: "Micemore2026+" */

export async function onRequestGet(context) {

  try {

    const url = new URL(context.request.url);
    const clientId = url.searchParams.get("clientId");

    if(!clientId){
      return new Response(JSON.stringify({
        error:"missing clientId"
      }),{headers:{ "Content-Type":"application/json" }});
    }


    const COMPANY_LOGIN = "micemore";
    const API_KEY = "047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72";


    // STEP 1 — ottenere token
    const login = await fetch(
      "https://user-api.simplybook.me/login",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
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


    // STEP 2 — calcolo sign (MD5)
    const sign = await md5(clientId + API_KEY);


    // STEP 3 — prenotazioni cliente
    const bookings = await fetch(
      "https://user-api.simplybook.me",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "X-Company-Login":COMPANY_LOGIN,
          "X-Token":token
        },
        body:JSON.stringify({
          jsonrpc:"2.0",
          method:"getClientBookings",
          params:[
            clientId,
            sign,
            {
              upcoming_only:false,
              confirmed_only:false
            }
          ],
          id:2
        })
      }
    );

    const bookingsData = await bookings.text();

    return new Response(bookingsData,{
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*"
      }
    });

  } catch(err){

    return new Response(
      JSON.stringify({error:err.toString()}),
      {headers:{ "Content-Type":"application/json" }}
    );

  }

}



// funzione MD5 per Workers
async function md5(str){

  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

}
