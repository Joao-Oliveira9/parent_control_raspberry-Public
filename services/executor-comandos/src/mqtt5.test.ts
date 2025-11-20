import { mqtt5,io } from 'aws-iot-device-sdk-v2';

    test("Testando comunicação", async () => {

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

        await client.start()

        const subscribe = await client.subscribe({
            subscriptions: [
                { topicFilter: "pi/requests", qos: mqtt5.QoS.AtLeastOnce }
            ]
        });

        expect(subscribe.reasonCodes[0]).toBe(mqtt5.QoS.AtLeastOnce)

    });

    test("Testando envio", async() => {
        
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

        await client.start()

        await client.subscribe({
            subscriptions: [
                { topicFilter: "pi/requests", qos: mqtt5.QoS.AtLeastOnce }
            ]
        });

        const message = {
            "correlationId": "teste123", 
            "message": `Cliente FF:FF:FF:FF:FF:FF foi inserido no grupo teste com sucesso`,
            "status": "ok"
        }

        const publish = await client.publish({
            topicName: `pi/responses`,
            qos: mqtt5.QoS.AtLeastOnce,
            payload: JSON.stringify({
                ...message,
                connectionId: "teste123"
            })
        });

        expect(publish).toHaveProperty('resonCode');

    })

