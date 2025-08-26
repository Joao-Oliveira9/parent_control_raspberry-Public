import express from 'express';
import {Request, Response} from 'express';
import { addDomainBlockList, create_group, insert_client_in_group, remove_client, remove_client_group, remove_group} from '../PiHoleService';

function routes() {

    const router = express.Router()
 
    router.post('/bloquear', async (req: Request, res: Response) => {
        //Colocar try catch
        const { dominio } = req.body;

        if (dominio) {

            if(!dominio['domain-name'] || !dominio['group_name']){
                res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
                return; 
            }

            const nome = dominio['domain-name'] as string;
            const group = dominio['group_name'] as string;

            const response = await addDomainBlockList(nome, group);

            //lambda -> API -> front 
            if (response) {
                res.status(200).json({ "message": `Domínio ${nome} adicionado a lista de bloqueios do grupo ${group}`, "status": "ok"});
            } else {
                res.status(500).json({ "message": 'Erro ao bloquear o domínio', "status": "erro" });
            }
        } else {
            res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
        }
        
    })

    router.post('/add_client', async (req: Request, res: Response) => {

        const { client } = req.body;    

        if(client) {

            if(!client['client_address'] || !client['group_name']){
                res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
                return; 
            }

            const client_address = client['client_address'] as string;
            const group_name = client['group_name'] as string;

            const response = await insert_client_in_group(client_address, group_name);

            if (response) {
                res.status(200).json({ "message": `Cliente ${client_address} foi inserido no grupo ${group_name} com sucesso`, "status": "ok"});
            } else {
                res.status(500).json({ "message": `Não foi possivel inserir o cliente ${client_address} no grupo ${group_name}`, "status": "erro" });
            }
        } else {
            res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
        }
        
    })

    router.post('/create_group', async (req: Request, res: Response) => {

        const { group } = req.body;    

        if(group) {
            
            if(!group['group-name']){
                res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
                return; 
            }

            const group_name = group['group-name'] as string;
            
            const response = await create_group(group_name);

            const { sucesso, grupo_existe } = { sucesso: response[0], grupo_existe: response[1] };

            
            if (sucesso && !grupo_existe) {
                //true && false -> grupo criado
                res.status(200).json({ "message": `Grupo ${group_name} criado com sucesso`, "status": "ok"});
            } else if (!sucesso && grupo_existe) {
                //false && true -> grupo ja existe
                res.status(500).json({ "message": `O ${group_name} já existe`, "status": "existe" });
            } else {
                //false && false -> erro ao criar grupo
                res.status(500).json({ "message": `Não foi possivel criar o grupo ${group_name}`, "status": "erro" });
            }
        } else {
            res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
        }
        
    })

    router.post('/remove_client', async (req: Request, res: Response) => {
        
        const { client } = req.body;

        if(client){

            if(!client['client_address'] || !client['group_name']){
                res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
                return; 
            }

            const client_address = client['client_address'] as string;
            const group_name = client['group_name'] as string;

            const response = await remove_client(client_address, group_name);

            if (response) {
                res.status(200).json({ "message": `Cliente  ${client_address} foi removido`, "status": "ok"});
            } else {
                res.status(500).json({ "message": `Não foi possivel remover o cliente ${client_address}`, "status": "erro" });
            }
        } else {
            res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
        }

        
    })


    router.post('/remove_group', async (req: Request, res: Response) => {

        const { group } = req.body;

        if(group){

            if(!group['group_name'] || !group['macAddress']){
                res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
                return; 
            }

            const group_name = group['group_name'] as string;
            const macAddress = group['macAddress'] as string[];

            const response = await remove_group( group_name, macAddress);

            if (response) {
                res.status(200).json({ "message": `Grupo ${group_name} removido com sucesso`, "status": "ok"});
            } else {
                res.status(500).json({ "message": `Não foi possivel remover o grupo ${group_name}`, "status": "erro" });
            }
        } else {
            res.status(400).json({ "message": 'Parâmetros inválidos', "status": "erro" });
        }
    })

}