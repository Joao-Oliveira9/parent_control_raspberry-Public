import log from "./coletor-logs/src/model/log-db-model";
import { UtilsRoutes } from "./coletor-logs/src/routers/utils-routes";
import sequelize from "./coletor-logs/database/database-connection";
import { connect } from "./executor-comandos/src/mqtt5";

async function main() {
  const teste = new UtilsRoutes();
  //connect();

  //console.log("valor:", JSON.stringify(valor, null, 2));
}

main().catch(console.error);
