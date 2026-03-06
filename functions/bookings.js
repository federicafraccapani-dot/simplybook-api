/* login: micemore */
/* key: 047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72 */
/* secret: a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8 */

export async function onRequestGet() {

  // STEP 1 — login per ottenere il token
  const login = await fetch(
  "https://user-api.simplybook.me/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: {
        company: "micemore",
        login: "gp@micemorevents.it",
        password: "Micemore2026+"
      },
      id: 1
    })
  }
);

  const loginData = await login.json();
  const token = loginData.result;

  // STEP 2 — recuperare prenotazioni
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
        params: {},
        id: 1
      })
    }
  );

  const data = await bookings.text();

  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });

}

