import { mqtt5,io } from 'aws-iot-device-sdk-v2';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { IoTClient, ListPrincipalThingsCommand } from '@aws-sdk/client-iot';
import { handleCreateGroup, handleDeleteGroup } from './handleGrupo';
import { handleCreateClient, handleDeleteClient } from './handleCliente';
import { handleAddBlock } from './handleDomainBlock';

interface DeviceInfo {
  clientId: string;
  thingName: string;
}

async function getDeviceInfo(certPemPath: string): Promise<DeviceInfo> {
    try {
        const file = './device_info.json';
        if (fs.existsSync(file)) {
            const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as DeviceInfo;
            return data;

        } 

        const thingName = await getThingName(certPemPath);
        const clientId = thingName + '_1';

        console.log(thingName)
        console.log(clientId)

        const deviceInfo: DeviceInfo = { clientId, thingName };

        fs.writeFileSync(file, JSON.stringify(deviceInfo, null, 2));
        console.log('✅ Novo device_info.json criado:', deviceInfo);

        return deviceInfo;
        
    } catch (error) {
        console.error('Erro ao obter informações do dispositivo:', error);
        throw error;
    }
}

async function getThingName(certPemPath: string): Promise<string> {
    try {
        const fileName = certPemPath.split('/').pop() || '';
        const thingName = fileName.replace('.cert.pem', '').replace('.private.key', '');

        
        if (!thingName) {
            throw new Error('Não foi possível extrair o thingName do caminho do certificado');
        }
        
        return thingName;

    } catch (error) {
        console.error('Erro ao ler o arquivo de certificado:', error);
        throw error;
    }
}

async function connect(): Promise<void> {
    try {

        const {clientId, thingName} = await getDeviceInfo("./conexao/raspberry_pi_bloqueio.cert.pem");

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
        client.start()

        console.log("Cliente MQTT 5 iniciado e ouvindo mensagens.");

        //registrando o dispositivo no banco de dados via lambda
        const registerTopic = 'pi/register';
        await client.publish({
            topicName: 'pi/register',
                qos: mqtt5.QoS.AtLeastOnce,
                payload: JSON.stringify({
                    thingName: thingName,
                    clientId: clientId,
                    timestamp: new Date().toISOString()
            })
        })

        console.log(` Registro enviado automaticamente para Lambda via ${registerTopic}`);

        const requestTopic = `pi/${thingName}/requests`;
        const responseTopic = `pi/${thingName}/responses`;

        console.log(`Ouvindo mensagens no tópico: ${requestTopic}`);

        client.subscribe({
          subscriptions: [
            { topicFilter: requestTopic, qos: mqtt5.QoS.AtLeastOnce }
          ]
        });


        client.on('messageReceived', async (eventData)  => {
            console.log(eventData);
            const topic = eventData.message.topicName;
            const payload = Buffer.from(
                eventData.message.payload as ArrayBuffer
            ).toString();

            const message = JSON.parse(payload);

            console.log(`Mensagem recebida no tópico ${topic}: ${message}`);

            // Processar a mensagem conforme necessário
            if (topic === `pi/${thingName}/requests`) {
                let response = {};
                switch(message.action){
                    case 'create_group':
                        const group_name = message.body['group-name'] as string;

                        console.log(`Criando grupo: ${group_name}`);
                        response = await handleCreateGroup(group_name, message.correlationId);

                        break;
                    case 'add_client':
                        const client_address = message.body['client_address'] as string;
                        const group_name_client = message.body['group_name'] as string;

                        console.log(`Adicionando cliente: ${client_address} ao grupo: ${group_name_client}`);
                        console.log(message.correlationId);
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

                        response = await handleDeleteClient(client_address_to_remove, group_name_client_to_remove, message.correlationId);

                        break;
                    case 'add_block':
                        const domain_name = message.body['domain-name'] as string;
                        const group = message.body['group-name'] as string;

                        response = await handleAddBlock(domain_name, group, message.correlationId);
                        break;
                    default:
                        console.log(`Ação desconhecida: ${message.action}`);
                }

                await client.publish({
                    topicName: responseTopic,
                    qos: mqtt5.QoS.AtLeastOnce,
                    payload: JSON.stringify({
                        ...response,
                        connectionId: message.connectionId
                    })
                });

                console.log(`📤 Resposta publicada em ${responseTopic}:`, JSON.stringify(response));
            }

        });

       } catch (error: any) {
        console.error('Erro ao conectar ou processar mensagens:', error);
    }
}


connect();
