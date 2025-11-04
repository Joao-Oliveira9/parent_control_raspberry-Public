import log from "./coletor-logs/src/model/log-db-model";
import { UtilsRoutes } from "./coletor-logs/src/routers/utils-routes";
import sequelize from "./coletor-logs/database/database-connection";

async function main() {
  const teste = new UtilsRoutes();


  //console.log("valor:", JSON.stringify(valor, null, 2));
}

main().catch(console.error);
