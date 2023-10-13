const qrcode = require('qrcode-terminal');
const { Client,LocalAuth,Buttons } = require('whatsapp-web.js');

const asyncRedis = require("async-redis");
const rclient = asyncRedis.createClient();
const mariadb = require('mariadb');
const pool = mariadb.createPool({
     host: 'localhost', 
     user:'wabot', 
     password: 'w4B0t!@#',
     database: 'wabot',
     connectionLimit: 5
});

const client = new Client({  
    authStrategy: new LocalAuth(),
	puppeteer: {
		args: ['--no-sandbox'],
	}
})

client.on('qr', (qr) => {
    // console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});
client.on('message', async msg => { 
    console.log(msg.from,msg.body)
    if(msg.from.includes("g.")){}
    else{
        let conn;
        let pos = await rclient.get(msg.from+"_pos");
        if(pos==null){
            pos = '0';
            await rclient.set(msg.from+"_pos",pos);
        }
        switch(pos){
            case '0' : {
                            if(msg.body.startsWith('1') ){ 
                                await rclient.set(msg.from+"_pos",'1');
                                await kirimMessage(msg,'1') 
                            }
                            else if(msg.body.startsWith('2') ){ 
                                await rclient.set(msg.from+"_pos",'2');
                                await kirimMessage(msg,'2')
                            }
                            else if(msg.body.startsWith('3') ){ 
                                await rclient.set(msg.from+"_pos",'3'); 
                                await kirimMessage(msg,'3')
                            }
                            else{
                                await kirimMessage(msg,pos)
                            }
                            break;
                        }
            case '1' : {
                            if(msg.body.startsWith('0') ){
                                await rclient.set(msg.from+"_pos",'0'); 
                                await kirimMessage(msg,'0')
                            }
                            else if(msg.body.startsWith('1') ){
                                await rclient.set(msg.from+"_pos",'4'); 
                                await kirimMessage(msg,'0')
                            }
                            else{
                                await kirimMessage(msg,pos)
                            }
                            break;
                        }
            case '2' : {
                            if(msg.body.startsWith('0') ){
                                await rclient.set(msg.from+"_pos",'0');
                                await kirimMessage(msg,'0')
                            }
                            else{
                                await kirimMessage(msg,pos)
                            }
                            break;
                        }
            case '3' : { 
                            if(msg.body.startsWith('0') ){
                                await rclient.set(msg.from+"_pos",'0');
                                await kirimMessage(msg,'0')
                            }
                            else{
                                await kirimMessage(msg,pos)
                            }
                            break;
                        }
        }
    }
}); 


async function kirimMessage(msg,pos){
    let conn
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT menu FROM menu where id=?", [ pos ] );
    conn.end(); 
    let message = ""
    if(rows.length==0){
        message = "Hi"
    }
    else{
        message = rows[0]['menu']
    }
    
    client.sendMessage(msg.from, message); 
    try {
        let button = new Buttons(message,[{body:'bt1'},{body:'bt2'},{body:'bt3'}],'title','footer');
        client.sendMessage(msg.from, button);
        
    } catch (error) {
        console.log(error)        
    }
    
}
client.initialize();

 