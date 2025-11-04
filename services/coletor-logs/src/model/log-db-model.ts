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
    Ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Timestamp:{
      type: DataTypes.DATE,
      allowNull:false,
    }
  },
  {
    tableName: "Logs_table",
  }
);

export default log;
