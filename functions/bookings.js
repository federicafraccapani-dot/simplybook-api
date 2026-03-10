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

  if (url.pathname === "/generateBookings") {
    return generateBookings();
}

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

  const timeslots = provider.timeslots || {};

  const fri = (timeslots["2026-04-17"] || []).length;
  const sat = (timeslots["2026-04-18"] || []).length;

  result[provider.provider_id] = {
    fri: fri,
    sat: sat,
    total: fri + sat
  };

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

  async function generateBookings() {

    const serviceId = 2;
    const clientId = 123; // buyer internazionale

    const providersDay1 = Array.from({length:52},(_,i)=>i+4); // 4-55
    const providersDay2 = Array.from({length:55},(_,i)=>i+1); // 1-55

    const baseSlots = ["09:00","10:00","11:00","12:00"];
    const offsets = [0,15,30,45];

    function addMinutes(time,minutes){
        let [h,m]=time.split(":").map(Number);
        let d=new Date(0,0,0,h,m+minutes);
        return d.toTimeString().slice(0,5);
    }

    async function simplybook(method,params){

        const res = await fetch("https://user-api.simplybook.me",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "X-Company-Login":SIMPLYBOOK_LOGIN,
                "X-Token":SIMPLYBOOK_TOKEN
            },
            body:JSON.stringify({
                jsonrpc:"2.0",
                method:method,
                params:params,
                id:1
            })
        });

        const data = await res.json();

        if(data.error){
            console.log("API error",data.error);
        }

        return data.result;
    }

    async function bookingExists(provider,date,start){

        const bookings = await simplybook("getBookings",{
            provider_id:provider,
            date_from:date,
            date_to:date
        });

        if(!bookings) return false;

        for(const b of bookings){

            const t = b.start_time.substring(0,5);

            if(t === start){
                return true;
            }

        }

        return false;

    }

    async function createBooking(provider,date,start){

        const end = addMinutes(start,15);

        const exists = await bookingExists(provider,date,start);

        if(exists){
            console.log("SKIP existing",provider,date,start);
            return;
        }

        console.log("CREATE",provider,date,start);

        await simplybook("createBooking",{
            service_id:serviceId,
            provider_id:provider,
            client_id:clientId,
            date:date,
            start_time:start,
            end_time:end
        });

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

    console.log("Generating 17 April");

    await generateDay("2026-04-17",false,providersDay1);

    console.log("Generating 18 April");

    await generateDay("2026-04-18",true,providersDay2);

    return new Response("Booking generation completed");

}

}



































