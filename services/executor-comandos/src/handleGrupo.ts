import { create_group, remove_group } from "./PiHoleService";

export async function handleCreateGroup(group_name: string, correlationId: any): Promise<any> {
    try {
        console.log(group_name);

        const response = await create_group(group_name);
        const { sucesso, grupo_existe } = { sucesso: response[0], grupo_existe: response[1] };

        let res = {};

        if (sucesso && !grupo_existe) {
            //true && false -> grupo criado
            res = { "correlationId": correlationId, "message": `Grupo ${group_name} criado com sucesso`, "status": "ok"};
        } else if (!sucesso && grupo_existe) {
            //false && true -> grupo ja existe
            res = { "correlationId": correlationId, "message": `O ${group_name} já existe`, "status": "existe" };
        } else {
            //false && false -> erro ao criar grupo
            res = { "correlationId": correlationId, "message": `Não foi possivel criar o grupo ${group_name}`, "status": "erro" };
        } 
	console.log(JSON.stringify(res));
        return res;
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        return { "correlationId": correlationId, "message": 'Parâmetros inválidos', "status": "erro" } ;
    }
}

export async function handleDeleteGroup(group_name: string, macAddress: string[], correlationId: any): Promise<any> {
    try {
        console.log(group_name);

        const response = await remove_group(group_name, macAddress);

        let res = {};

        if (response) {
            res = { "correlationId": correlationId, "message": `Grupo ${group_name} foi removido com sucesso`, "status": "ok" };
        
        } else {

            res = { "correlationId": correlationId, "message": `Não foi possivel remover o grupo ${group_name}`, "status": "erro" };
        }

        return res;
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        return { "correlationId": correlationId, "message": 'Parâmetros inválidos', "status": "erro" } ;
    }
}
