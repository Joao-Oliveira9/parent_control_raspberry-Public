import { UtilsRoutes } from "./coletor-logs/src/routers/utils-routers/utils-routes.js";
const teste = new UtilsRoutes()
// var sid = await teste.getSid()
// await teste.cancelSid(sid);
const valor = await teste.getQueries();
//console.log("valor:", JSON.stringify(valor, null, 2))
