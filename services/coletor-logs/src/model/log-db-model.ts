import { Domain } from "domain";
import sequelize from "../../database/database-connection";
import { DataTypes } from "sequelize";

const log = sequelize.define(
  "Log",
  {
    Domain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Mac: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Timestamp:{
      type: DataTypes.BIGINT,
      allowNull:false,
    }
  },
  {
    tableName: "Logs_table",
  }
);

log.sync();
export default log;
