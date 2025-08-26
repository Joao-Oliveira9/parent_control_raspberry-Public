import express from 'express';
import {Request, Response} from 'express';
import { addDomainBlockList, create_group, insert_client_in_group, remove_client, remove_client_group, remove_group} from '../PiHoleService';

function routes() {

    const router = express.Router()
 
    router.post('/bloquear', async (req: Request, res: Response) => {
        //Colocar try catch
        const { dominio } = req.body;

        if (dominio) {
            const nome = dominio['domain-name'] as string;
            const group = dominio['group_name'] as string;

            const response = await addDomainBlockList(nome, group);

            //lambda -> API -> front 
            if (response) {
                res.status(200).json({ "message": `Domínio ${nome} adicionado a lista de bloqueios do grupo ${group}`, "status": "ok"});
            } else {
                res.status(500).json({ "Error": 'Erro ao bloquear o domínio', "status": "error" });
            }
        }
        
    })

    router.post('/add_client', async (req: Request, res: Response) => {

        const { client } = req.body;    

        if(client) {
            const client_address = client['client_address'] as string;
            const group_name = client['group_name'] as string;

            const response = await insert_client_in_group(client_address, group_name);

            if (response) {
                res.status(200).json({ "message": `Cliente ${client_address} foi inserido no grupo ${group_name} com sucesso`, "status": "ok"});
            } else {
                res.status(500).json({ "Error": `Não foi possivel inserir o cliente ${client_address} no grupo ${group_name}`, "status": "error" });
            }
        }
        
    })

    router.post('/remove_client', async (req: Request, res: Response) => {
        
        const { client } = req.body;

        if(client){
            const client_address = client['client_address'] as string;
            const group_name = client['group_name'] as string;

            const response = await remove_client(client_address, group_name);

            if (response) {
                res.status(200).json({ "message": `Cliente  ${client_address} foi removido`, "status": "ok"});
            } else {
                res.status(500).json({ "Error": `Não foi possivel remover o cliente ${client_address}`, "status": "error" });
            }
        }

        
    })

    router.post('/add_group', async (req: Request, res: Response) => {

        
    })

    router.post('/remove_group', async (req: Request, res: Response) => {

        
    })

}