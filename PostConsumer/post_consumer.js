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

        const queue = 'event';

        channel.assertQueue(queue, {
            durable: false //change back to true
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, async function(msg) {
            //convert msg to json
            const msgData = JSON.parse(msg.content)
            console.log(" [x] Received %s", msgData);

            //simulated computation
            const start = Date.now();
            while (Date.now() < start + 5000) {/* simulate heavily computation*/ }
            console.log('heavy computation done :)');

            //communication with mongoDB
            databaseContact(msgData)
        }, {
            noAck: true //change to false to send validation
        });
    });
});

const databaseContact = async(msg) => {
    //connect to MongoDB database -- buffers so no need to await but style choice
    try{
        // console.log('mongoose URI: ', process.env.MONGOOSE_URI); - DELETE
        await mongoose.connect(process.env.MONGOOSE_URI, {dbName: 'Rapsodo'});
    }catch(e) { console.log('Database connection ERROR: %s\n\n', e)}

    //create instance of eventlog w/ schema then save to database
    const newEvent = new EventLog({...msg, receivedAt: new Date()});
    console.log("new event: ", newEvent);
    await newEvent.save();

    //show all events in database - DELETE
    // console.log("all events: ", await EventLog.find());
}
