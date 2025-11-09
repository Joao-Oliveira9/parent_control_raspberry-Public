import { DataTypes } from "sequelize";
import sequelize from "../../database/database-connection.js";
import { log } from "console";

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
}, {
  tableName: "logs_timestamp",  
  freezeTableName: true,        
  timestamps: false             
});

logTimestampModel.sync();
export default logTimestampModel;
