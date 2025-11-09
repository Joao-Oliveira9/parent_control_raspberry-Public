// import log from "../model/log-db-model.js";
import log from "../model/log-db-model.js";
// import logTimestampModel from "../model/log-timestamp-model.js";
import logTimestampModel from "../model/log-timestamp-model.js";
import arp from "node-arp";
import cron from "node-cron";

const pihole_url = 'http://192.168.0.21/api';
const password = "y8q3CW6u"

export class UtilsRoutes {
  token: string | null = null;
  payload: { method: string; headers: { "Content-Type": string }; body: string };

  constructor() {
    console.log("alo")
    this.payload = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: password }),
    };

    this.startCron();
  }

  async getSid() {
    const data = await fetch(`${pihole_url}/api/auth`, this.payload);
    const valor = await data.json();
    this.token = valor.session.sid;
    return this.token;
  }

  async cancelSid() {
    if (!this.token) return;
    await fetch(`${pihole_url}/api/auth?sid=${this.token}`, {
      method: "DELETE",
    });
    this.token = null;
  }

  async getMacAsync(ip:string) {
        return new Promise<string>((resolve, reject) => {
        arp.getMAC(ip, (err:any, mac:string) => {
        if (err) return reject(err);
          resolve(mac);
        });
      });
  }

  async getQueries(token: string) {
    const urls = [
      `${pihole_url}/api/queries?domain=www.*&type=AAAA&status=FORWARDED`,
      `${pihole_url}/api/queries?domain=www.*.com.br&type=AAAA&status=FORWARDED`,
      `${pihole_url}/api/queries?domain=*.com&type=AAAA&status=FORWARDED`,
      `${pihole_url}/api/queries?domain=*.com.br&type=AAAA&status=FORWARDED`,
    ];

    const regexValido = /^(www\.)?[a-zA-Z0-9-]+\.(com|org)(\.br)?$/


    const data = (
      await Promise.all(
        urls.map((url) =>
          fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              sid: `${token}`,
            },
          })
            .then((res) => res.json())
            .then((res) => {
              const arrayQueries = res.queries || [];
              return arrayQueries.filter((element: { domain: string }) =>
                regexValido.test(element.domain)
              );
            })
        )
      )
    ).flat();

    // const logs = data.map((element) => ({
    //   timestamp: element.time,
    //   domain: element.domain,
    //   client: {
    //     ip: element.client.ip,
    //     name: element.client.name,
    //   },
    // }));

    const logs = await Promise.all(
      data.map(async(element) => {
        const mac = await this.getMacAsync(element.client.ip);
        console.log(element.timestamp);
        const logV = {
          timestamp: element.time,
          domain: element.domain,
          client: {
            mac: mac,
            name: element.client.name,
          },
        };
      return logV;
    }))

    const ultimoRegistro = await logTimestampModel.findOne({
      order: [["lastTimestamp", "DESC"]],
    });

  const ultimoTimestamp: bigint = ultimoRegistro
    ? BigInt(ultimoRegistro.get("lastTimestamp") as string | number | bigint)
    : 0n;


  console.log("ultimo timestamp: "+ultimoTimestamp)

  const seen = new Set();

  const novosLogs = logs
    .map((l: any) => ({ ...l, timestamp: Math.floor(l.timestamp) })) // uniformiza
    .filter((l: any) => l.timestamp > ultimoTimestamp)
    .filter((l: any) => {
      if (seen.has(l.timestamp)) return false;
      seen.add(l.timestamp);
      return true;
    });

    console.log("novosLogs"+novosLogs)

    console.log(`Total recebido: ${logs.length}`);
    console.log(`Novos a inserir1: ${novosLogs.length}`);

    for (const element of novosLogs) {
      await log.create({
        Domain: element.domain,
        Mac: element.client.mac,
        Name: element.client.name,
        Timestamp: element.timestamp,
      });
    }

    if (novosLogs.length > 0) {
      const maxTimestamp = Math.max(...novosLogs.map((l) => l.timestamp));
      console.log("maxTimestamp" + maxTimestamp)
      if (ultimoRegistro) {
        await ultimoRegistro.update({ lastTimestamp: maxTimestamp });
      } else {
        await logTimestampModel.create({ lastTimestamp: maxTimestamp });
      }
    }

    return novosLogs;
  }

  startCron() {
    console.log("passei aqui123")
   
    cron.schedule("*/30 * * * * *", async () => {
      console.log("Execução automática iniciada:", new Date().toLocaleString());
      try {
        const token = await this.getSid();
        if (!token) {
          console.error("Falha ao obter SID. Abortando execução.");
          return;
        }

        await this.getQueries(token);
        await this.cancelSid();
        console.log("Rotina concluída com sucesso.");
      } catch (error) {
        console.error("Erro na execução automática:", error);
      }
    });
  }
}
