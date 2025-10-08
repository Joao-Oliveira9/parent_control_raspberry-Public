const pihole_url = 'http://192.168.0.21/api'; //depois colocar no .env
const password = 'y8q3CW6u'; //depois colocar no .env

const create_session = async function (): Promise<string> {
    try {

        let sid = '';

        const response = await fetch(`${pihole_url}/auth`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password })
        });

        if (!response.ok) {
           console.error('Failed to create session');
        }

       
        const data = await response.json();
            
        if(data && data['session'] && data['session']['sid']) {

            sid = data['session']['sid'];

        } else if(data && data['session']) console.error(data['session']['message']);
        else if(data && data['error']) console.error(data['error']['message']);
        
        return sid; 

    } catch (error) {
        console.error('Error creating session:', error);
        return ''
    }

}

const delete_session = async function (sid: string): Promise<void> {

    try {
        const response = await fetch(`${pihole_url}/auth?sid=${sid}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to delete session');
        }

    } catch (error) {
        console.error('Error deleting session:', error);
    }
}

const get_id_group = async function (sid: string, group_name: string): Promise<number> {
    try {

        let group_id = -1; //default group

        const response = await fetch(`${pihole_url}/groups/${group_name}?sid=${sid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to get groups');
        } else {

            const data = await response.json();

            if (data && data['groups'] && data['groups'][0] && data['groups'][0]['id']) {
                group_id = data['groups'][0]['id'];
            }

        }
	
	console.log(group_id);
        return group_id;

    } catch (error) {
        console.error('Error getting group ID:', error);
        return -1;
    }
}

const verificar_dominio = async function (domain_name: string, sid: string): Promise<[boolean, number[]]> {

    try {
        let resposta: [boolean, number[]] = [false, []];

        const response = await fetch(`${pihole_url}/domains/deny?sid=${sid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to verify domain');
            return resposta;
        } 

        const data = await response.json();

        if(data && data['domains']) {
            //Analisando o JSON -> pegando os domains
            for(const domain of data['domains']) {
                if(domain['domain'] === domain_name) {
                    //grupos pertencentes a esse dominio
                    if(domain['groups']) {
			resposta = [true, domain['groups']]; 
                        break;
		    }
                }
            }
        }

        return resposta;

    } catch(error) {
        console.error('Error verifying domain:', error);
        return [false, [-1]];
    }
}

const verificando_cliente = async function (sid: string, client_name: string): Promise<any> {
    let grupos: number[] = [];
    let existe: boolean = false;

    try {

        const response = await fetch(`${pihole_url}/clients/${client_name}?sid=${sid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to get clients');
	    return { grupos: [-1], existe: false };
        } 

        const data = await response.json();

        if(data && data['clients']) {
            //Analisando o JSON -> pegando os clients

            for(const client of data['clients']) {
               
               if(client['client'] === client_name && client['groups']) {
                    grupos = client['groups'];
                    existe = true;
                    break;
               }
                
            }

        } 
	

	console.log(grupos);
	console.log(existe);
        return { grupos, existe };

    }catch (error) {
        console.error('Error getting client groups:', error);
	return { grupos: [-1], existe: false };

    }
}

export const addDomainBlockList = async function (domain: string, group_name: string): Promise<boolean> {

    let sid = '';

    let sucesso = false;

    try {
        const sid = await create_session();
        const id_group = await get_id_group(sid , group_name);
        
        // verificar se o dominio ja esta na lista de bloqueados em algum outro grupo
        const [existeDominio, grupos] = await verificar_dominio(domain, sid);
	
	console.log(existeDominio);
	console.log(grupos);

        if(existeDominio) {
            //se ja existe, verificar se nao esta no grupo
            if(!grupos.includes(id_group)) {
		console.log("Nao esta no grupo");
                //se nao esta no grupo, adicionar o grupo a lista de grupos do dominio
                grupos.push(id_group);
		console.log(grupos);
                //fazer o update do dominio com os novos grupos
                const response = await fetch(`${pihole_url}/domains/deny/exact/${domain}?sid=${sid}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({groups: grupos, "enabled": true})
                });

                if (!response.ok) {
                    console.error('Failed to update domain groups');
                    return sucesso;
                }

                sucesso = true;
            }
        
        } else if(grupos.length === 1 && grupos[0] === -1){
            console.error('Error verifying domain groups');
            return sucesso; //erro ao verificar dominio

        } else {
            
            //se nao existe, adicionar um grupo ao dominio
            const response = await fetch(`${pihole_url}/domains/deny/exact?sid=${sid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "domain": domain,
                    groups: [id_group], 
                    "enabled": true
                })
            });

            if (!response.ok) {
                console.error('Failed to add domain to block list');
                return sucesso;
            }

	    sucesso = true;
        }

        return sucesso;
    } catch (error) {
        console.error('Error adding domain to block list:', error);
        return false;
    } finally {
        if (sid) await delete_session(sid);
    }
}

export const create_group = async function (group_name: string): Promise<boolean[]> {

    console.log("oi");
    let sucesso = false;
    let grupo_existe = false;

    let resultado: boolean[] = [sucesso, grupo_existe];
    
    let sid = '';

    try {
        sid = await create_session();
        console.log(sid);

        const response = await fetch(`${pihole_url}/groups?sid=${sid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "name": group_name })
        });
        
        console.log(response.ok);

        if (!response.ok) {
            console.error('Failed to create group');
            return resultado;
        }

        const data = await response.json();
        console.log(data);

        if(data && data['processed']) {
            const errors = data['processed']['errors'];

            if (Array.isArray(errors)){
                console.log(errors)
                if (errors.length === 0) sucesso = true;
                else if(errors[0]['error'] === 'UNIQUE constraint failed: group.name') grupo_existe = true;    
            } 
        }

        resultado = [sucesso, grupo_existe];
        console.log(resultado);
        return resultado;

    } catch (error) {
        console.error('Error creating group:', error);
        return [false, false];
    } finally {
        if (sid) await delete_session(sid);
    }
}

export const create_client = async function (client_name: string, group_id: number): Promise<boolean> {
    
    let resposta: boolean = false;

    let sid = '';

    try {
        sid = await create_session();
        const { grupos, existe } = await verificando_cliente(sid, client_name) as { grupos: number[], existe: boolean };

	if(grupos[0] === -1 && existe === false){
	     console.error("Erro");
	     return resposta;
	}

        if(grupos.length === 0 && existe === false) {
            //cliente nao existe
            grupos.push(group_id);
	    console.log(grupos);            

            const response = await fetch(`${pihole_url}/clients?sid=${sid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "client": client_name, "groups": grupos })
            });

            if (!response.ok) {
                console.error('Failed to create client');
                return resposta;
            }

            const data = await response.json();

            if(data && data['processed']) {
                const errors = data['processed']['errors'];

                if (Array.isArray(errors)){
                    if (errors.length === 0) resposta = true;
                    else resposta = false;    
                } 
            }
        } else {
	    console.log("cliente existe");
            if(!grupos.includes(group_id)) {
                //adicionar o grupo a lista de grupos do cliente
                grupos.push(group_id);
		console.log(grupos);

                const response = await fetch(`${pihole_url}/clients/${client_name}?sid=${sid}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "groups": grupos })
                });
                if (!response.ok) {
                    console.error('Failed to update client groups');
                    return resposta;
                }
                const data = await response.json();
                if(data && data['error']) resposta = false;
                else resposta = true;
            }    
        }
        
        return resposta;

    } catch (error) {
        console.error('Error creating client:', error);
        return false;
    } finally {
        if (sid) await delete_session(sid);
    }
}

export const remove_client_group = async function (sid: string, group_id: number): Promise<boolean> {

    try {
        //Pegando todos os dominios bloqueados
        const response = await fetch(`${pihole_url}/domains/deny?sid=${sid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to get blocked domains');
            return false;
        }

        const data = await response.json();
        if(data && data['domains']) {
            //Analisando o JSON -> pegando os domains
            for(const domain of data['domains']) {
                if(domain['groups'] && domain['groups'].includes(group_id)) {
                    //verificando se o dominio possui os campos necessarios

                    const grupos = domain['groups'];

                    let payload = {};

                    if(domain['type'] && domain['kind'] && domain['domain']) {
                        const type = domain["type"]
                        const kind = domain["kind"]
                        const dominio = domain["domain"]

                        if(grupos.length != 0) {
                            console.log(`Domain: ${dominio}, Type: ${type}, Kind: ${kind}, Groups: ${grupos}`);
                            const novo = grupos.filter((id: number) => id !== group_id);

                            console.log(`"tamanho > 1 -> ", ${novo}`);

                            payload = {"groups": novo};
                        }

                        const responseUpdated = await fetch(`${pihole_url}/domains/${type}/${kind}/${dominio}?sid=${sid}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });

                        if (!responseUpdated.ok) {
                            console.error('Failed to update domain groups');
                            return false;
                        }
                    }
                }
            }
        }

        return true;

    } catch (error) {
        console.error('Error removing client from group:', error);
        return false;
    }
   
}

export const remove_group = async function (group_name: string, client_name: string[]): Promise<boolean> {
    //Para remover: 1° Remove o domain de bloqueio. 2° Remove o grupo do cliente
    let sucesso = true;
    let sid = '';

    try {
        sid = await create_session();
        const id_group = await get_id_group(sid , group_name);

        //Remover o grupo do cliente
        const deletado = await remove_client_group(sid, id_group);

        for(const macAddress of client_name) {
            //Grupos do cliente
            const { grupos, existe } = await verificando_cliente(sid, macAddress);

            if(grupos.includes(id_group)) {
                //remover o grupo da lista de grupos do cliente
                grupos.splice(grupos.indexOf(id_group), 1);

                const response = await fetch(`${pihole_url}/clients/${macAddress}?sid=${sid}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({"groups": grupos})
                });

                if (!response.ok) {
                    console.error('Failed to update client groups');
                    sucesso = false;
                    break;     
                }
            }
        }

        if (deletado || client_name.length === 0 || sucesso) {
            //Remover o grupo
	    console.log("vou deletar!");
            const response = await fetch(`${pihole_url}/groups/${group_name}?sid=${sid}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

	    console.log(JSON.stringify(response));

            if (!response.ok) {
                console.error('Failed to delete group');
                return false;
            }

            sucesso = true;

        }

        return sucesso;
        
    }catch(error) {
        console.error('Error removing client:', error);
        return false;
    } finally {
        if (sid) await delete_session(sid);
    }
}

export const remove_client = async function (client_name: string, group_name: string): Promise<boolean> {

    let sid = '';
    let sucesso = true;

    try {
        sid = await create_session();

        const id_group = await get_id_group(sid , group_name);
        const { grupos, existe } = await verificando_cliente(sid, client_name);

        if(grupos.includes(id_group)) {
            //remover o grupo da lista de grupos do cliente
            const idx = grupos.indexOf(id_group);
            if (idx === -1) {
                console.error('Client does not belong to the specified group');
                return false;
            }

            grupos.splice(idx, 1);

            const response = await fetch(`${pihole_url}/clients/${client_name}?sid=${sid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"groups": grupos})
            });

            if (!response.ok) {
                console.error('Failed to update client groups');
                return false;     
            }

            const data = await response.json();

            if(data && data['error']) sucesso = false;

        }
        return sucesso;
    } catch(error) {
        console.error('Error removing client:', error);
        return false;
    } finally {
        if (sid) await delete_session(sid);
    }
}

export const insert_client_in_group = async function (client_name: string, group_name: string): Promise<boolean> {

    try {
        const id_group = await get_id_group(await create_session() , group_name);
        const sucessoCreate = await create_client(client_name, id_group);

        if(sucessoCreate) return true;
        else return false;
        
    } catch (error) {
        console.error('Error inserting client in group:', error);
        return false;
    }
}
