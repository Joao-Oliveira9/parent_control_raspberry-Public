const pihole_url = 'https://192.168.0.21/api'; //depois colocar no .env
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
        const response = await fetch(`${pihole_url}/auth?sid={${sid}}`, {
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

        return group_id;

    } catch (error) {
        console.error('Error getting group ID:', error);
        return -1;
    }
}

const verificar_dominio = async function (sid: string): Promise<[boolean, number[]]> {

    try {
        let resposta: [boolean, number[]] = [false, [-1]];

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
                if(domain['domain'] === domain.name) {
                    //grupos pertencentes a esse dominio
                    if(domain['groups']) resposta = [true, domain['groups']]; 
                    break;
                }
            }
        }

        return resposta;

    } catch(error) {
        console.error('Error verifying domain:', error);
        return [false, [-1]];
    }
}

const verificando_cliente = async function (sid: string, client_name: string): Promise<number[]> {
    let grupos = [-1];

    try {

        const response = await fetch(`${pihole_url}/clients/${client_name}?sid=${sid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to get clients');
            return grupos;
        } 

        const data = await response.json();

        if(data && data['clients']) {
            //Analisando o JSON -> pegando os clients
            const clientes = data['clients'][0];

            if(clientes) {
                if(clientes['client'] === client_name && clientes['groups']) {
                    grupos = clientes['groups'];
                }
            } else {
                console.error('Client not found');
                grupos = [0]; //cliente nao existe
            }

        } 

        return grupos;

    }catch (error) {
        console.error('Error getting client groups:', error);
        return grupos;
    }
}

const addDomainBlockList = async function (domain: string, group_name: string): Promise<boolean> {

    let sid = '';

    let sucesso = false;

    try {
        const sid = await create_session();
        const id_group = await get_id_group(sid , group_name);
        
        // verificar se o dominio ja esta na lista de bloqueados em algum outro grupo
        const [existeDominio, grupos] = await verificar_dominio(sid);

        if(existeDominio) {
            //se ja existe, verificar se nao esta no grupo
            if(!grupos.includes(id_group)) {
                //se nao esta no grupo, adicionar o grupo a lista de grupos do dominio
                grupos.push(id_group);
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

                const data = await response.json();

                if(data && data['processed']['error'].length === 0) sucesso = true;
            }
        
        } else if(grupos.length === 1 && grupos[0] === -1){
            console.error('Error verifying domain groups');
            return sucesso; //erro ao verificar dominio

        } else {
            
            //se nao existe, adicionar um grupo ao dominio
            const response = await fetch(`${pihole_url}/domains/deny/exact/${domain}?sid=${sid}`, {
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

            const data = await response.json();

            if(data && data['processed'] && data['processed']['error'].length === 0) sucesso = true;
        }

        return sucesso;
    } catch (error) {
        console.error('Error adding domain to block list:', error);
        return false;
    } finally {
        if (sid) await delete_session(sid);
    }
}

