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

var rooms = {};

function leave_room(socket){
    socket.get('room',function(err,room){
        if(err){
            console.log(err);
        }else{
            socket.leave(room);
            console.log('*********leave room: ',room);
            socket.get('nickname',function(err, nickname){
                if(err){
                    console.log(err);
                }else{
                    for(var i in rooms[room].members){
                        if(rooms[room].members[i]==nickname){
                            rooms[room].members.splice(i,1);
                        }
                    }
                    socket.broadcast.to(room).emit('member left room',nickname);
                    socket.emit('member left room',nickname);
                }
            });
            socket.broadcast.to(room).emit('list room members',rooms[room].members);
            list_rooms(socket);
        }
    })
}

function list_rooms(socket){
    var room_list = [];
    for(rm in rooms){
        if(rm && rooms[rm].members.length){
            room_list.push({name:rm, count:rooms[rm].members.length});
        }else{
            delete rooms[rm];
        }
    }
    socket.emit('list rooms',room_list);
    socket.broadcast.emit('list rooms',room_list);
}

io.sockets.on('connection', function (socket) {
    list_rooms(socket);

    socket.on('set nickname', function (name) {
        socket.set('nickname', name, function () {
            console.log('***********nickname set:', name)
            socket.emit('nickname set');
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
                // console.log('*********io',io.sockets.manager)

                socket.get('room', function(err,oldroom){
                    if(err){
                        console.log(err);
                    }else{
                        if(oldroom){
                            leave_room(socket);
                        }
                    }
                })

                socket.join(room);
                socket.set('room', room);
                console.log('***********room:',room);

                if(rooms){
                    if(rooms[room]){
                        rooms[room].members.push(nickname);
                    }else{
                        rooms[room] = {members:[nickname],videos:[]};
                    }
                }

                socket.emit('room joined', room);
                list_rooms(socket);
                socket.emit('list room members',rooms[room].members);
                socket.broadcast.to(room).emit('new room member', nickname);
            }
        })
    })

    socket.on('leave room', function(){
        leave_room(socket);
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