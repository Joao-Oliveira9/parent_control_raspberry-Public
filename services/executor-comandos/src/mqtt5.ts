import { mqtt5, io } from 'aws-iot-device-sdk-v2';
import * as fs from 'fs';
import { handleCreateGroup, handleDeleteGroup } from './handleGrupo';
import { handleCreateClient, handleDeleteClient } from './handleCliente';
import { handleAddBlock } from './handleDomainBlock';
import { handleGetLogs } from './handleLog';

export async function connect(): Promise<void> {
    try {

        const tlsOptions: io.TlsContextOptions = io.TlsContextOptions.create_client_with_mtls_from_path(
            "./conexao/raspberry_pi_bloqueio.cert.pem",
            "./conexao/raspberry_pi_bloqueio.private.key"
        );

        const tlsContext = new io.ClientTlsContext(tlsOptions);

        const config: mqtt5.Mqtt5ClientConfig = {
            hostName: 'a15yjinlcnoxku-ats.iot.us-east-2.amazonaws.com',
            port: 8883,
            tlsCtx: tlsContext,
        };

        const client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);

        client.start();
        console.log("✅ Cliente MQTT 5 iniciado e ouvindo mensagens.");

        client.subscribe({
            subscriptions: [
                { topicFilter: "pi/requests", qos: mqtt5.QoS.AtLeastOnce }
            ]
        });

        client.on('messageReceived', async (eventData) => {
            console.log(eventData);
            const topic = eventData.message.topicName;
            const payload = Buffer.from(
                eventData.message.payload as ArrayBuffer
            ).toString();

            const message = JSON.parse(payload);

            console.log(`📩 Mensagem recebida no tópico ${topic}:`, message);

            if (topic === 'pi/requests') {
                let response = {};

                switch (message.action) {
                    case 'create_group':
                        const group_name = message.body['group-name'] as string;
                        console.log(`Criando grupo: ${group_name}`);
                        response = await handleCreateGroup(group_name, message.correlationId);
                        break;

                    case 'add_client':
                        const client_address = message.body['client_address'] as string;
                        const group_name_client = message.body['group_name'] as string;

                        console.log(`Adicionando cliente: ${client_address} ao grupo: ${group_name_client}`);
                        response = await handleCreateClient(client_address, group_name_client, message.correlationId);
                        break;

                    case 'delete_group':
                        const group_name_to_delete = message.body['group_name'] as string;
                        const macAddress = message.body['macAddress'] as string[];
                        response = await handleDeleteGroup(group_name_to_delete, macAddress, message.correlationId);
                        break;

                    case 'delete_client':
                        const client_address_to_remove = message.body['client_address'] as string;
                        const group_name_client_to_remove = message.body['group_name'] as string;

                        console.log(`Removendo cliente: ${client_address_to_remove} do grupo: ${group_name_client_to_remove}`);
                        response = await handleDeleteClient(client_address_to_remove, group_name_client_to_remove, message.correlationId);
                        break;

                    case 'add_block':
                        const domain_name = message.body['domain-name'] as string;
                        const group = message.body['group-name'] as string;

                        console.log(`Adicionando bloqueio de domínio: ${domain_name} no grupo: ${group}`);
                        response = await handleAddBlock(domain_name, group, message.correlationId);
                        break;

                    case 'create_log':
                        const client_name = message.body['client_name'] as string;

                        response = await handleGetLogs(client_name, message.correlationId);
                        break;

                    default:
                        console.log(`⚠️ Ação desconhecida: ${message.action}`);
                }

                console.log("📦 Resposta:", JSON.stringify(response));

                await client.publish({
                    topicName: `pi/responses`,
                    qos: mqtt5.QoS.AtLeastOnce,
                    payload: JSON.stringify({
                        ...response,
                        connectionId: message.connectionId
                    })
                });

                console.log("📤 Resposta publicada:", JSON.stringify(response));
            }
        });

    } catch (error: any) {
        console.error('Erro ao conectar ao broker MQTT:', error.message);
    }
}

//connect();
