// Подключение всех модулей к программе
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');
const url = require('url');
let currentUrl;
// Отслеживание порта
server.listen(4007);


// Отслеживание url адреса и отображение нужной HTML страницы
app.get('/', function(request, response) {
  currentUrl = url.format({
  protocol: request.protocol,
  host: request.get('host'),
  pathname: request.originalUrl
});
  response.sendFile(__dirname + '/index.html');
});

// Массив со всеми подключениями
connections = [];
users = [];

function getCurrentTime() {
  var now = new Date();
  var year = now.getFullYear();
  var month = ('0' + (now.getMonth() + 1)).slice(-2);
  var day = ('0' + now.getDate()).slice(-2);
  var hours = ('0' + now.getHours()).slice(-2);
  var minutes = ('0' + now.getMinutes()).slice(-2);
  var seconds = ('0' + now.getSeconds()).slice(-2);
  return '[' + year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + ']';
}

// Отправка сообщения о подключении пользователя
const sendUserJoinedMessage = function(username){
   io.sockets.emit('in_out',{mess: `${username} вошел в чат.`, name: ``});
};

// Отправка сообщения о отключении пользователя
const sendUserLeftMessage = function(username) {
      io.sockets.emit('in_out',{mess: `${username} вышел из чата.`, name: ``});
};

// Отслеживание подключений
io.on('connection', function (socket) {
  console.log("Успешное соединение");
 
  // Обработка события подключения нового пользователя
    socket.on('user joined', function(username){
     socket.username = username;
     users.push({ socket: socket, ip: ip, joinedTime: new Date() });  
      sendUserJoinedMessage(username);
    }); 
  // Получение IP-адреса пользователя
  var ip = socket.handshake.address;
  // Запись информации в лог-файл
  var log = getCurrentTime() + ' ' + ip + ' CONNECT '+ currentUrl;
  fs.appendFileSync('log.txt', log + '\n');

  // Функция, которая срабатывает при отключении от сервера
  socket.on('disconnect', function(data) {
  console.log("Отключение");
  
 // Удаления пользователя из массива
    connections.splice(connections.indexOf(socket), 1);
    // Удаление пользователя из массива
    var userIndex = users.findIndex(function(user) {
      return user.socket === socket;
    });

    if (userIndex !== -1) {
      var user = users[userIndex];
      users.splice(userIndex, 1);
      // Запись информации в лог-файл
      var log = getCurrentTime() + ' ' + user.ip + ' DISCONNECT ' +currentUrl;
      fs.appendFileSync('log.txt', log + '\n');
      console.log("Выход из чата");
      sendUserLeftMessage(socket.username);

}
  });
  // Функция получающая сообщение от какого-либо пользователя
  socket.on('send mess', function(data) {
    // Внутри функции мы передаем событие 'add mess',
    // которое будет вызвано у всех пользователей и у них добавиться новое сообщение

    io.sockets.emit('add mess', { mess: data.mess, name: socket.username, className: data.className });
  });
});
