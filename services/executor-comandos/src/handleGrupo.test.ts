import { create_group, remove_group } from "./PiHoleService";
import { handleCreateGroup, handleDeleteGroup } from "./handleGrupo";

jest.mock('./PiHoleService', () => ({
  create_group: jest.fn(),
  remove_group: jest.fn(),
}));

describe('Testando handleCreateGroup', () => {
    const correlationId = 'teste123';
    const group_name = 'teste';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('insert_client_in_group é sucesso', async() => {
        (create_group as jest.Mock).mockResolvedValue([true, false]);

        const result = await handleCreateGroup(group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Grupo ${group_name} criado com sucesso`,
            status: "ok"
        });

        expect(create_group).toHaveBeenCalledWith(group_name);
    });

    it('grupo já existe', async() => {
        (create_group as jest.Mock).mockResolvedValue([false, true]);

        const result = await handleCreateGroup(group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `O ${group_name} já existe`,
            status: "existe"
        });

        expect(create_group).toHaveBeenCalledWith(group_name);
    });

    it('erro ao criar grupo', async() => {
        (create_group as jest.Mock).mockResolvedValue([false, false]);

        const result = await handleCreateGroup(group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Não foi possivel criar o grupo ${group_name}`,
            status: "erro"
        });

        expect(create_group).toHaveBeenCalledWith(group_name);
    });

    it('try-catch', async() => {
        (create_group as jest.Mock).mockRejectedValue(new Error('Network Request Error'));

        const result = await handleCreateGroup(group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Parâmetros inválidos`,
            status: "erro"
        });

        expect(console.error).toHaveBeenCalledWith('Erro ao criar grupo:', expect.any(Error));
        expect(create_group).toHaveBeenCalledWith(group_name);
    });
});

describe('Testando handleDeleteGroup', () => {
    const correlationId = 'teste123';
    const client_address = ['AA:AA:AA:AA:AA:AA', 'FF:FF:FF:FF:FF:FF'];
    const group_name = 'teste';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('insert_client_in_group é sucesso', async() => {
        (remove_group as jest.Mock).mockResolvedValue(true);

        const result = await handleDeleteGroup(group_name, client_address, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Grupo ${group_name} foi removido com sucesso`,
            status: "ok"
        });

        expect(remove_group).toHaveBeenCalledWith(group_name, client_address);
    });

    it('erro ao criar grupo', async() => {
        (remove_group as jest.Mock).mockResolvedValue(false);

        const result = await handleDeleteGroup(group_name, client_address, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Não foi possivel remover o grupo ${group_name}`,
            status: "erro"
        });

        expect(remove_group).toHaveBeenCalledWith(group_name, client_address);
    });

    it('try-catch', async() => {
        (remove_group as jest.Mock).mockRejectedValue(new Error('Network Request Error'));

        const result = await handleDeleteGroup(group_name, client_address, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Parâmetros inválidos`,
            status: "erro"
        });

        expect(console.error).toHaveBeenCalledWith('Erro ao criar grupo:', expect.any(Error));
        expect(remove_group).toHaveBeenCalledWith(group_name, client_address);
    });
});