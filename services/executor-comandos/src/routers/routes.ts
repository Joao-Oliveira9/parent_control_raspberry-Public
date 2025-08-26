import express from 'express';
import {Request, Response} from 'express';
import { addDomainBlockList, create_group, insert_client_in_group, remove_client, remove_client_group, remove_group} from '../PiHoleService';

function routes() {

    const router = express.Router()

    //preciso colocar ESModule 
    router.post('/bloquear', async (req: Request, res: Response) => {
        //Colocar try catch
        const { dominio } = req.body;

        if (dominio) {
            const nome = dominio['domain-name'] as string;
            const group = dominio['group_name'] as string;

            const response = await addDomainBlockList(nome, group);

            //lambda -> API -> front 
            if (response) {
                res.status(200).json({ "message": `Domínio ${nome} adicionado a lista de bloqueios do grupo ${group}`, "staturs": "ok"});
            } else {
                res.status(500).json({ "Error": 'Erro ao bloquear o domínio', "status": "error" });
            }
        }
        
    })

    router.post('/add_client', async (req: Request, res: Response) => {

        
    })

    router.post('/remove_client', async (req: Request, res: Response) => {
        

        
    })

    router.post('/add_group', async (req: Request, res: Response) => {

        
    })

    router.post('/remove_group', async (req: Request, res: Response) => {

        
    })

}