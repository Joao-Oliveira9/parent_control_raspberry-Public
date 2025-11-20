import { handleGetLogs } from "./handleLog";
import log from "../../coletor-logs/src/model/log-db-model";

jest.mock("../../coletor-logs/src/model/log-db-model");

describe("handleGetLogs", () => {
  const mockLogs = [
    { id: 1, Mac: "AA:BB:CC", Timestamp: "2025-01-01" },
    { id: 2, Mac: "AA:BB:CC", Timestamp: "2025-01-02" }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deve retornar lista de logs com sucesso", async () => {
    (log.findAll as jest.Mock).mockResolvedValue(mockLogs);

    const correlationId = "12345";
    const mac = "AA:BB:CC";

    const result = await handleGetLogs(mac, correlationId);

    expect(log.findAll).toHaveBeenCalledTimes(1);
    expect(log.findAll).toHaveBeenCalledWith({
      where: { Mac: mac },
      order: [["Timestamp", "DESC"]],
    });

    expect(result).toEqual({
      correlationId,
      message: "Lista de logs recuperada com sucesso",
      status: "ok",
      data: mockLogs,
    });
  });

  test("deve tratar erro e retornar status 'erro'", async () => {
    (log.findAll as jest.Mock).mockRejectedValue(new Error("DB FAIL"));

    const correlationId = "ABC";
    const mac = "11:22:33";

    const result = await handleGetLogs(mac, correlationId);

    expect(log.findAll).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      correlationId,
      message: "Erro interno ao buscar logs",
      status: "erro",
    });
  });
});
