import { Sequelize } from "sequelize";

// mock do Sequelize
jest.mock("sequelize");

describe("Database connection", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  test("deve logar sucesso ao conectar no banco", async () => {
    // mock do método authenticate
    (Sequelize as unknown as jest.Mock).mockImplementation(() => {
      return {
        authenticate: jest.fn().mockResolvedValueOnce(undefined),
      };
    });

    // importa o arquivo (executará o IIFE automaticamente)
    await import("./database-connection");

    expect(consoleLogSpy).toHaveBeenCalledWith("database-connection carregado");
    expect(consoleLogSpy).toHaveBeenCalledWith("Conexão estabelecida com sucesso.");
  });

});
