// 
// /**
//  * Module dependencies.
//  */
// 
// var express = require('express');
// 
// var app = module.exports = express.createServer();
// 
// // Configuration
// 
// app.configure(function(){
//   app.set('views', __dirname + '/views');
//   app.set('view engine', 'jade');
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(app.router);
//   app.use(express.static(__dirname + '/public'));
// });
// 
// app.configure('development', function(){
//   app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
// });
// 
// app.configure('production', function(){
//   app.use(express.errorHandler()); 
// });
// 
// // Routes
// 
// app.get('/', function(req, res){
//   res.render('index', {
//     title: 'Express'
//   });
// });
// 
// app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000, function() {
//   console.log('Ready');
// 
//   // if run as root, downgrade to the owner of this file
//   if (process.getuid() === 0)
//     require('fs').stat(__filename, function(err, stats) {
//       if (err) return console.log(err)
//       process.setuid(stats.uid);
//     });
// });

var express = require('express')
    ,app = express.createServer()
  , io = require('socket.io').listen(app)
  // ,nko = require('nko');

  app.configure(function(){
    app.use(express.static(__dirname + '/public'));
  });


app.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var rooms = [];

io.sockets.on('connection', function (socket) {
    socket.emit('list rooms',rooms)

    socket.on('set nickname', function (name) {
        socket.set('nickname', name, function () {
            console.log('***********nickname set:', name)
            socket.emit('ready');
        });
    });

    socket.on('join room', function(room){
        console.log('****** joining room');
        socket.get('nickname', function(err, nickname){
            if(err){
                console.log('****** nickname error');
                console.log(err);
            }else{
                console.log('***********name:',nickname);

                // var rooms = io.sockets.manager.rooms;
                console.log('*********io',io.sockets.manager)

                socket.join(room);
                socket.set('room', room);
                console.log('***********room:',room);
                
                var room_exists = false;
                if(rooms.length){
                    for(i=0;i<rooms.length;i++){
                        if(rooms[i] == room){
                            room_exists = true;
                        }
                    }
                }
                if(!room_exists){
                    console.log('********* room not in list of existing rooms')
                    rooms.push(room);
                }else{
                    console.log('********* room is in list of existing rooms')
                }
                
                socket.emit('list rooms',rooms);
                socket.broadcast.emit('list rooms',rooms);
                socket.broadcast.to(room).emit('new user', nickname);
            }
        })
    })
    
    // socket.send('room_name',{ current_video: 'http://vimeo.com/10866394' });
    socket.on('add video', function (data) {
        socket.get('nickname',function(err, nickname){
            if(err){
                console.log(err);
            }else{
                socket.get('room', function(err,room){
                    if(err){
                        console.log(err);
                    }else{
                        socket.broadcast.to(room).emit('add video',{url:data.url,from:nickname});
                    }
                })
            }
        })
    });
});