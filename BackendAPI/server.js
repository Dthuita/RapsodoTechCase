const { v4: uuidv4 } = require("uuid");
const express = require("express");
const amqp = require("amqplib/callback_api");

const app = express();
const port = 8081;

//middleware to parse json for post requests
app.use(express.json());

//test get request
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//test post request
app.post("/", (req, res) => {
  console.log(req.body);
  res.send("ok!");
});

app.get("/events", (req, res) => {
  //get w/ source and-or type; 
  //if no query given empty obj created to get all events logged
  const query = {
    ...(req.query.source !== undefined && { source: req.query.source }),
    ...(req.query.type !== undefined && { type: req.query.type }),
  };
  console.log("given querys: ", query);


  //send to rabbitMQ - nonblocking
  amqp.connect("amqp://rabbitmq:5672", function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }

      channel.assertQueue(
        "",
        {
          exclusive: true,
        },
        function (error2, q) {
          if (error2) {
            throw error2;
          }
          var correlationId = uuidv4();
          console.log('correlationId:', correlationId)


          channel.consume(
            q.queue,
            function (msg) {
              if (msg.properties.correlationId == correlationId) {
                //convert to json
                finalmsg = JSON.parse(msg.content.toString('utf8'));

                console.log(" [.] Got %s", finalmsg);
                res.send(finalmsg)
                
                setTimeout(function () {
                  connection.close();
                }, 500);
              }
            },
            {
              noAck: true,
            }
          );

          //sanity test for buffer works :)
          // let buf =  Buffer.from(JSON.stringify({something: 'something'}), 'utf8')
          // console.log('\n\n buffered %s \n\n', buf);
          // let debuf =  JSON.parse(buf.toString('utf8'));
          // console.log('\n\n debuffered %s \n\n', debuf.something);


          channel.sendToQueue(
            'event-get-rpc',
            Buffer.from(JSON.stringify(query), 'utf8'),
            {
              correlationId: correlationId,
              replyTo: q.queue,
              contentType: 'application/json' 
            }
          );
        }
      );
    });
  });


});

app.post("/event", (req, res) => {
  //validate data - do they exist
  if (
    req.body?.source === undefined ||
    req.body?.type === undefined ||
    req.body?.payload === undefined ||
    req.body?.payload?.userId === undefined ||
    req.body?.payload?.ip === undefined ||
    req.body?.timestamp === undefined
  )
    return res.status(404).send({ error: "Data incomplete!" });

  //validate data - check values --- check for date typeof!!!
  if (
    typeof req.body.source !== "string" ||
    typeof req.body.type !== "string" ||
    typeof req.body.payload !== "object" ||
    typeof req.body.payload.userId !== "string" ||
    typeof req.body.payload.ip !== "string"
  )
    return res.status(404).send({ error: "Data not of right type!" });

  //special date check
  const properDate = new Date(req.body.timestamp);
  if (isNaN(properDate.getTime())) //handles timestamps properly now
    return res.status(404).send({ error: "Date format bad!" });

  //generate eventID and received time to send in msg
  const eventID = uuidv4();

  //send to rabbitMQ - nonblocking
  amqp.connect("amqp://rabbitmq:5672", function (error0, connection) {
    if (error0) {
      throw error0;
    }

    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }

      var queue = `event`;
      var msg = JSON.stringify({ ...req.body, eventId: eventID });

      channel.assertQueue(queue, {
        durable: false, //change to true
      });

      channel.sendToQueue(queue, Buffer.from(msg));
      console.log(" [Sent]: %s", msg);
    });
  });

  //respond to client
  res.send({
    status: "queued",
    eventId: eventID,
  });
});

app.listen(port, () => {
  console.log(
    `Example app listening on port ${port} at http://localhost:${port}`
  );
});
