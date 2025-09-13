import { Log } from "./model/log.js";



class ColectLogsRoute{
    
    constructor(){
        
    }
    
    //método para pegar os logs
    
   async getQueries():Promise<Log>{
        const data = await fetch("http://localhost:8000/queries")
        const valorQuery =  await data.json()
        return valorQuery as Log
   }

   
}