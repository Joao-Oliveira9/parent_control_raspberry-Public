import { Sequelize } from "sequelize";

console.log("database-connection carregado");

const sequelize = new Sequelize("logs_database", "root", "root", {
  host: "localhost",
  dialect: "mariadb",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexão estabelecida com sucesso.");
  } catch (error) {
    console.error("Erro ao conectar:", error);
  }
})();

export default sequelize;
