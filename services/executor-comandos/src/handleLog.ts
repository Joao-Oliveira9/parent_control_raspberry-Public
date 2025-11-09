import log from "../../coletor-logs/src/model/log-db-model";


export async function handleGetLogs(macAddress: string, correlationId: any): Promise<any> {
  try {
    const logs = await log.findAll({
      where: {Mac: macAddress},
      order: [["Timestamp", "DESC"]], 
    });

    const response = {
      correlationId,
      message: "Lista de logs recuperada com sucesso",
      status: "ok",
      data: logs,
    };

    console.log(`✅ ${logs.length} logs encontrados.`);
    return response;
  } catch (error) {
    console.error("❌ Erro ao buscar logs:", error);
    return {
      correlationId,
      message: "Erro interno ao buscar logs",
      status: "erro",
    };
  }
}
