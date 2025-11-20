import { insert_client_in_group, remove_client } from "./PiHoleService";
import { handleCreateClient, handleDeleteClient } from "./handleCliente";

jest.mock('../services/PiHoleService', () => ({
  insert_client_in_group: jest.fn(),
  remove_client: jest.fn(),
}));

describe('Testando handleCreateClient', () => {
    const correlationId = 'teste123';
    const client_address = 'FF:FF:FF:FF:FF:FF';
    const group_name = 'teste';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('insert_client_in_group é sucesso', async() => {
        (insert_client_in_group as jest.Mock).mockResolvedValue(true);

        const result = await handleCreateClient(client_address, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Cliente ${client_address} foi inserido no grupo ${group_name} com sucesso`,
            status: "ok"
        });

        expect(insert_client_in_group).toHaveBeenCalledWith(client_address, group_name);
    });

    it('insert_client_in_group é false', async() => {
        (insert_client_in_group as jest.Mock).mockResolvedValue(false);

        const result = await handleCreateClient(client_address, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Não foi possivel inserir o cliente ${client_address} no grupo ${group_name}`,
            status: "erro"
        });

        expect(insert_client_in_group).toHaveBeenCalledWith(client_address, group_name);
    });

    it('try-catch', async() => {
        (insert_client_in_group as jest.Mock).mockRejectedValue(new Error('Network Request Error'));

        const result = await handleCreateClient(client_address, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Parâmetros inválidos`,
            status: "erro"
        });

        expect(console.error).toHaveBeenCalledWith('Erro ao criar grupo:', expect.any(Error));
        expect(insert_client_in_group).toHaveBeenCalledWith(client_address, group_name);
    });
});

describe('Testando handleDeleteClient', () => {
    const correlationId = 'teste123';
    const client_address = 'FF:FF:FF:FF:FF:FF';
    const group_name = 'teste';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('remove_client é sucesso', async() => {
        (remove_client as jest.Mock).mockResolvedValue(true);

        const result = await handleDeleteClient(client_address, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Cliente ${client_address} foi removido com sucesso`,
            status: "ok"
        });

        expect(remove_client).toHaveBeenCalledWith(client_address, group_name);
    });

    it('insert_client_in_group é false', async() => {
        (remove_client as jest.Mock).mockResolvedValue(false);

        const result = await handleDeleteClient(client_address, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Não foi possivel remover o cliente ${client_address}`,
            status: "erro"
        });

        expect(remove_client).toHaveBeenCalledWith(client_address, group_name);
    });

    it('try-catch', async() => {
        (remove_client as jest.Mock).mockRejectedValue(new Error('Network Request Error'));

        const result = await handleDeleteClient(client_address, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Parâmetros inválidos`,
            status: "erro"
        });

        expect(console.error).toHaveBeenCalledWith('Erro ao remover cliente:', expect.any(Error));
        expect(remove_client).toHaveBeenCalledWith(client_address, group_name);
    });
})