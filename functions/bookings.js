/* login: micemore */
/* key: 047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72 */
/* secret: a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8 */

export async function onRequestGet() {

  // STEP 1 — ottenere token
  const auth = await fetch(
    "https://user-api-v2.simplybook.it/admin/auth",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-Login": "micemore",
        "X-API-Key": "047b3e6349938ce1f4b8e84e4b357bb8eb6de3968fcc9a5788d125dbe2c0cf72",
        "X-API-Secret": "a8ebe7f3c807665fd36c0775cd1edea0c7ea19412a9137b41c5644ddab00dee8"
      }
    }
  );

  const authData = await auth.json();
  const token = authData.token;

  // STEP 2 — recuperare prenotazioni
  const bookings = await fetch(
    "https://user-api-v2.simplybook.it/admin/bookings",
    {
      headers: {
        "X-Company-Login": "COMPANY_LOGIN",
        "X-Token": token
      }
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
