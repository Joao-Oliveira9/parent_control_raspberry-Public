import { addDomainBlockList, unblockDomain } from "./PiHoleService";

export async function handleAddBlock(domain_name: string, group_name: string, correlationId: any): Promise<any> {
    try {
        console.log(group_name);

        const response = await addDomainBlockList(domain_name, group_name);
        
        let res = {};

        if (response) {
            res = { "correlationId": correlationId, "message": `Domínio ${domain_name} adicionado a lista de bloqueios do grupo ${group_name}`, "status": "ok"};
        } else {
            res = { "correlationId": correlationId, "message": `Não foi possível bloquear`, "status": "erro" };
        }

        return res;
    } catch (error) {
        console.error('Erro ao bloquear site:', error);
        return { "correlationId": correlationId, "message": 'Parâmetros inválidos', "status": "erro" } ;
    }
}

export async function handleUnblockDomain(domain_name: string, group_name: string, correlationId: any): Promise<any> {
    try {
        console.log(group_name);

        const response = await unblockDomain(domain_name, group_name);

        let res = {};

        if (response) {
            res = { "correlationId": correlationId, "message": `Domínio ${domain_name} do grupo ${group_name} foi desbloqueado com sucesso!`, "status": "ok"};
        } else {
            res = { "correlationId": correlationId, "message": `Não foi possível desbloquear!`, "status": "erro" };
        }

        return res;
    } catch (error) {
        console.error('Erro ao bloquear site:', error);
        return { "correlationId": correlationId, "message": 'Parâmetros inválidos', "status": "erro" } ;
    }
}

