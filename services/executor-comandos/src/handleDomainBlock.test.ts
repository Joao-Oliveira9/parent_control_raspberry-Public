import { addDomainBlockList, unblockDomain } from "./PiHoleService";
import { handleAddBlock, handleUnblockDomain } from "./handleDomainBlock";

jest.mock('./PiHoleService', () => ({
  addDomainBlockList: jest.fn(),
  unblockDomain: jest.fn(),
}));

describe('Testando handleAddBlock', () => {
    const correlationId = 'teste123';
    const domain_name = 'facebook.com';
    const group_name = 'teste';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('addBlockList é sucesso', async() => {
        (addDomainBlockList as jest.Mock).mockResolvedValue(true);

        const result = await handleAddBlock(domain_name, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Domínio ${domain_name} adicionado a lista de bloqueios do grupo ${group_name}`,
            status: "ok"
        });

        expect(addDomainBlockList).toHaveBeenCalledWith(domain_name, group_name);
    });

    it('addBlockList é false', async() => {
         (addDomainBlockList as jest.Mock).mockResolvedValue(false);

        const result = await handleAddBlock(domain_name, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Não foi possível bloquear`,
            status: "erro"
        });

        expect(addDomainBlockList).toHaveBeenCalledWith(domain_name, group_name);
    });

    it('try-catch', async() => {
        (addDomainBlockList as jest.Mock).mockRejectedValue(new Error('Network Request Error'));

        const result = await handleAddBlock(domain_name, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Parâmetros inválidos`,
            status: "erro"
        });

        expect(console.error).toHaveBeenCalledWith('Erro ao bloquear site:', expect.any(Error));
        expect(addDomainBlockList).toHaveBeenCalledWith(domain_name, group_name);
    });
});

describe('Testando handleUnblockDomain', () => {
    const correlationId = 'teste123';
    const domain_name = 'facebook.com';
    const group_name = 'teste';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('addBlockList é sucesso', async() => {
        (unblockDomain as jest.Mock).mockResolvedValue(true);

        const result = await handleUnblockDomain(domain_name, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Domínio ${domain_name} do grupo ${group_name} foi desbloqueado com sucesso!`,
            status: "ok"
        });

        expect(unblockDomain).toHaveBeenCalledWith(domain_name, group_name);
    });

    it('addBlockList é false', async() => {
        (unblockDomain as jest.Mock).mockResolvedValue(false);

        const result = await handleUnblockDomain(domain_name, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Não foi possível desbloquear!`,
            status: "erro"
        });

        expect(unblockDomain).toHaveBeenCalledWith(domain_name, group_name);
    });

    it('try-catch', async() => {
        (unblockDomain as jest.Mock).mockRejectedValue(new Error('Network Request Error'));

        const result = await handleUnblockDomain(domain_name, group_name, correlationId);
        expect(result).toEqual({
            correlationId: correlationId,
            message: `Parâmetros inválidos`,
            status: "erro"
        });

        expect(console.error).toHaveBeenCalledWith('Erro ao bloquear site:', expect.any(Error));
        expect(unblockDomain).toHaveBeenCalledWith(domain_name, group_name);
    });
});