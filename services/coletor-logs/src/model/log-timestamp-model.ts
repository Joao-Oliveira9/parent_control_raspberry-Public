import { DataTypes } from "sequelize";
import sequelize from "../../database/database-connection";

const logTimestampModel = sequelize.define("log_timestamp", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  lastTimestamp: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
});

export default logTimestampModel;
