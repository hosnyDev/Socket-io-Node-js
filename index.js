const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const io = require('socket.io')(http); 

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse the raw data
app.use(bodyParser.raw());
// parse text
app.use(bodyParser.text());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection',function(socket) {

  //The moment one of your client connected to socket.io server it will obtain socket id
  //Let's print this out.
  console.log(`Connection : SocketId = ${socket.id}`)
  //Since we are going to use userName through whole socket connection, Let's make it global.   
  var userName = '';
  
  socket.on('subscribe', function(data) {
      console.log('subscribe trigged')
      const room_data = JSON.parse(JSON.stringify(data))
      userName = room_data.userName;
      const roomName = room_data.roomName; 

      socket.join(`${roomName}`)
      console.log(`Username : ${userName} joined Room Name : ${roomName}`)
      
     
      // Let the other user get notification that user got into the room;
      // It can be use to indicate that person has read the messages. (Like turns "unread" into "read")

      //TODO: need to chose
      //io.to : User who has joined can get a event;
      //socket.broadcast.to : all the users except the user who has joined will get the message
      // socket.broadcast.to(`${roomName}`).emit('newUserToChatRoom',userName);
      io.to(`${roomName}`).emit('newUserToChatRoom',userName);

  })

  socket.on('unsubscribe',function(data) {
      console.log('unsubscribe trigged')
      const room_data = JSON.parse(JSON.stringify(data))
        userName = room_data.userName;
      const roomName = room_data.roomName;
      const timeStamp =  room_data.timeStamp;
 
      console.log(`Username : ${userName} leaved Room Name : ${roomName}`)
      socket.broadcast.to(`${roomName}`).emit('userLeftChatRoom',userName)
      socket.leave(`${roomName}`)
  })

  socket.on('newMessage',function(data) {
      console.log('newMessage triggered')

      const messageData = JSON.parse(JSON.stringify(data))
      const messageContent = messageData.messageContent
      const roomName = messageData.roomName
      const timeStamp =  messageData.timeStamp;
      const haseImage = messageData.haseImage;
 
      console.log(`[Room Number ${roomName}] ${userName} : ${haseImage}`)
      
      // Just pass the data that has been passed from the writer socket
      const chatData = {
          userName : userName,
          messageContent : messageContent,
          roomName : roomName,
          timeStamp : timeStamp,
           haseImage : haseImage
      }
      socket.broadcast.to(`${roomName}`).emit('updateChat',JSON.stringify(chatData)) // Need to be parsed into Kotlin object in Kotlin
  })

  socket.on('typing',function(roomNumber){ //Only roomNumber is needed here
      console.log('typing triggered '+roomNumber)
      socket.broadcast.to(`${roomNumber}`).emit('typing')
  })

  socket.on('stopTyping',function(roomNumber){ //Only roomNumber is needed here
      console.log('stopTyping triggered')
      socket.broadcast.to(`${roomNumber}`).emit('stopTyping')
  })
 
  socket.on('disconnect', function () {
      console.log("One of sockets disconnected from our server.")
  });
})

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});