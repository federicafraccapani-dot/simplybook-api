/* login: micemore */
/* key: 047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72 */
/* secret: a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8 */
/*company: "micemore" */
/*login: "gp@micemorevents.it" */
/*password: "Micemore2026+" */

export async function onRequestGet() {

  try {

    // STEP 1 — login
    const login = await fetch(
      "https://user-api.simplybook.me/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company: "micemore",
          login: "gp@micemorevents.it",
          password: "Micemore2026+"
        })
      }
    );

    const loginData = await login.json();

    if(!loginData.token){
      return new Response(JSON.stringify(loginData),{
        headers:{ "Content-Type":"application/json" }
      });
    }

    const token = loginData.token;


    // STEP 2 — getBookings
    const bookings = await fetch(
      "https://user-api.simplybook.me/admin/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-Login": "micemore",
          "X-User-Token": token
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getBookings",
          params: [],
          id: 1
        })
      }
    );

    const data = await bookings.text();

    return new Response(data,{
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
