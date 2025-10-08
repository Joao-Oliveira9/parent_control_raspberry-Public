// import express from 'express';
// import dotenv from 'dotenv';
// import { METHODS } from 'http';

// dotenv.config();
import log from "../model/log-db-model.js";
import { Log } from "../model/log";

// const app = express();

//definicao das rotas
export class UtilsRoutes {
  payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: "Wl1bqMPC" }),
  };

  //coleta do token
  async getSid() {
    const data = await fetch("http://192.168.15.2/api/auth", this.payload);
    const valor = await data.json();
    return valor.session.sid;
  }

  //cancelar o token
  async cancelSid(sid: any) {
    console.log(sid);
    const data = await fetch(`http://192.168.15.2/api/auth?sid=${sid}`, {
      method: "DELETE",
    });
  }

  //fazer a querie para o bd do pihole
  async getQueries(): Promise<Log[]> {
    const token = await this.getSid();
    const regex = "/jovemnerd.com$/"; // exemplo: termina com google.com

    const regexValido = /^(www\.)?[a-zA-Z0-9-]+(\.com(\.br)?)$/;

    const urls = [
      `http://192.168.15.2/api/queries?domain=www.*&type=AAAA&status=FORWARDED`,
      `http://192.168.15.2/api/queries?domain=www.*.com.br&type=AAAA&status=FORWARDED`,
      `http://192.168.15.2/api/queries?domain=*.com&type=AAAA&status=FORWARDED`,
      `http://192.168.15.2/api/queries?domain=*.com.br&type=AAAA&status=FORWARDED`,
    ];

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
              const arrayQueries = res.queries;
              return arrayQueries.filter((element: { domain: string }) =>
                regexValido.test(element.domain)
              );
            })
        )
      )
    ).flat();

    const logs = data.map((element) => {
      console.log(element.timestamp);
      const logV: Log = {
        timestamp: element.time,
        domain: element.domain,
        client: {
          ip: element.client.ip,
          name: element.client.name,
        },
      };
      return logV;
    });

    logs.forEach((element) => {
      log.create({
        Domain: element.domain,
        Ip: element.client.ip,
        Name: element.client.name,
      });
    });

    console.log(typeof logs);
    console.log(logs);
    this.cancelSid(token);

    return data;
  }
}
