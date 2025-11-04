import { insert_client_in_group, remove_client } from "./PiHoleService";

export async function handleCreateClient(client_address: string, group_name: string, correlationId: any): Promise<any> {
    try {
        console.log(group_name);

        const response = await insert_client_in_group(client_address, group_name);
 
        let res = {};

        if (response) {
            //true && false -> grupo criado
            res = { "correlationId": correlationId, "message": `Cliente ${client_address} foi inserido no grupo ${group_name} com sucesso`, "status": "ok"};
        } else {
            //false && false -> erro ao criar grupo
            res = { "correlationId": correlationId, "message": `Não foi possivel inserir o cliente ${client_address} no grupo ${group_name}`, "status": "erro" };
        }

        return res;
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        return { "correlationId": correlationId, "message": 'Parâmetros inválidos', "status": "erro" } ;
    }
}



export async function handleDeleteClient(client_address: string, group_name: string, correlationId: any): Promise<any> {
    try {
        console.log(group_name);

        const response = await remove_client(client_address, group_name);
 
        let res = {};

        if (response) {
            res = { "correlationId": correlationId, "message": `Cliente ${client_address} foi removido com sucesso`, "status": "ok"};
        } else {
            res = { "correlationId": correlationId, "message": `Não foi possivel remover o cliente ${client_address}`, "status": "erro" };
        }

        return res;
    } catch (error) {
        console.error('Erro ao remover cliente:', error);
        return { "correlationId": correlationId, "message": 'Parâmetros inválidos', "status": "erro" } ;
    }
}
