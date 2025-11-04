// import log from "../model/log-db-model.js";
import log from "../model/log-db-model.js";
// import logTimestampModel from "../model/log-timestamp-model.js";
import logTimestampModel from "../model/log-timestamp-model.js";
import cron from "node-cron";

export class UtilsRoutes {
  token: string | null = null;
  payload: { method: string; headers: { "Content-Type": string }; body: string };

  constructor() {
    this.payload = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: "Wl1bqMPC" }),
    };

    this.startCron();
  }

  async getSid() {
    const data = await fetch("http://192.168.15.2/api/auth", this.payload);
    const valor = await data.json();
    this.token = valor.session.sid;
    return this.token;
  }

  async cancelSid() {
    if (!this.token) return;
    await fetch(`http://192.168.15.2/api/auth?sid=${this.token}`, {
      method: "DELETE",
    });
    this.token = null;
  }

  async getQueries(token: string) {
    const urls = [
      `http://192.168.15.2/api/queries?domain=www.*&type=AAAA&status=FORWARDED`,
      `http://192.168.15.2/api/queries?domain=www.*.com.br&type=AAAA&status=FORWARDED`,
      `http://192.168.15.2/api/queries?domain=*.com&type=AAAA&status=FORWARDED`,
      `http://192.168.15.2/api/queries?domain=*.com.br&type=AAAA&status=FORWARDED`,
    ];

    const regexValido = /^(www\.)?[a-zA-Z0-9-]+(\.com(\.br)?)$/;

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

    const logs = data.map((element) => ({
      timestamp: element.time,
      domain: element.domain,
      client: {
        ip: element.client.ip,
        name: element.client.name,
      },
    }));

    const ultimoRegistro = await logTimestampModel.findOne({
      order: [["lastTimestamp", "DESC"]],
    });

    const ultimoTimestamp: number = ultimoRegistro
      ? (ultimoRegistro.get("lastTimestamp") as number)
      : 0;

    const novosLogs = logs.filter((l) => l.timestamp > ultimoTimestamp);

    console.log(`Total recebido: ${logs.length}`);
    console.log(`Novos a inserir: ${novosLogs.length}`);

    for (const element of novosLogs) {
      await log.create({
        Domain: element.domain,
        Ip: element.client.ip,
        Name: element.client.name,
        Timestamp: element.timestamp,
      });
    }

    if (novosLogs.length > 0) {
      const maxTimestamp = Math.max(...novosLogs.map((l) => l.timestamp));
      if (ultimoRegistro) {
        await ultimoRegistro.update({ lastTimestamp: maxTimestamp });
      } else {
        await logTimestampModel.create({ lastTimestamp: maxTimestamp });
      }
    }

    return novosLogs;
  }

  startCron() {
    console.log("passei aqui")
    cron.schedule("*/15 * * * *", async () => {
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
