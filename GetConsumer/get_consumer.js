const amqp = require('amqplib/callback_api');
const mongoose = require('mongoose')
require('dotenv').config();

//database schema
const Schema = mongoose.Schema;

const EventLog_Schema = new Schema({
    eventId: String, //server made
    source: String,
    type: {type: String}, //type keyword in mongoose reserved
    payload: {
        userId: String,
        ip: String
    },
    timestamp: Date,
    receivedAt: Date //server made
})
//class to construct docs
const EventLog = mongoose.model('EventLog', EventLog_Schema, 'techCase');


//rabbitMQ receiver
amqp.connect('amqp://rabbitmq:5672', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        const queue = 'event-get-rpc';

        channel.assertQueue(queue, {
            durable: false //change to true
        });

        channel.prefetch(1);
        console.log(' [x] Awaiting RPC requests');

        channel.consume(queue, async function reply(msg) {
            //convert msg to json
            const msgData =  JSON.parse(msg.content.toString('utf8'));
            console.log(" [x] Received %s", msgData); //should be either {} or have type and or source
            
            //convert msg to json
            const resp = await filterget(msgData);
            console.log('correlationId:', msg.properties.correlationId)

            channel.sendToQueue(msg.properties.replyTo, 
                Buffer.from(JSON.stringify(resp), 'utf8'),
                {
                    correlationId: msg.properties.correlationId,
                    contentType: 'application/json' 
                }
            );
            channel.ack(msg);
        });
    })
});

const filterget = async(msg) => {
    //connect to MongoDB database -- buffers so no need to await but style choice
    try{
        await mongoose.connect(process.env.MONGOOSE_URI, {dbName: 'Rapsodo'});
    }catch(e) { console.log('Database connection ERROR: %s\n\n', e)}

    console.log('msg: ', msg);

    //msg==null?return [allEventsLogged]: return [filteredEvents] 
    const filteredData = await EventLog.find(msg);
    
    console.log("[filtered events]: ", filteredData);
    return filteredData;
}
