var mysql = require('mysql')
var express = require('express')
var bodyParser = require('body-parser')
var fs = require('fs')
var app = express()
var http = require('http')
var path = require('path')
var mime = require('mime')
var itemidentifier
var url = require("url")
var socketio = require('socket.io')

const BASE_URL = 'http://ec2-13-209-22-0.ap-northeast-2.compute.amazonaws.com:3000/'


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))



var connection = mysql.createConnection({
  host: 'tbkdatabase3.c0eh6nyw1fpk.ap-northeast-2.rds.amazonaws.com',
  user: 'admin',
  database: 'example',
  password: '12345678',
  port: 8080
})
//////////////////////////////////////////////// newFeature : 채팅 방 리스트 조회 / 추가 ////////////////////////////////////////////////////////////////////
app.post('/chat/chatroom', function (req, res) {
  var chat_room_id = randomString(8)
  var buyer_id = req.body.buyer_id
  var mode = req.body.mode//refer or add

  if(mode == 'refer'){
    var sql_refer = 'select * from Chat_room where buyer_id = ?'
    var main = []
    var first_query_length
    console.log("Client" + buyer_id + " : tries to refer chat list.")
    connection.query(sql_refer,buyer_id, function (err, rows, result) {
      if (err) {
        console.log(err)
      } else {
        for(var i = 0; i < rows.length; i++){
          var sub = {
            'chat_room_id' : rows[i]._id,
            'seller_id': rows[i].seller_id,
            'last_statement': rows[i].last_statement
          }
          main[i] = sub
        }
        first_query_length = rows.length
        console.log(sub)
      }
    })
    var sql_refer2 = 'select * from Chat_room where seller_id = ?'
    var main2 = []
    connection.query(sql_refer2,buyer_id, function (err, rows, result) {
      if (err) {
        console.log(err)
      } else {
        for(var i = 0; i < rows.length; i++){
          var sub = {
            'chat_room_id' : rows[i]._id,
            'seller_id': rows[i].buyer_id,
            'last_statement': rows[i].last_statement
          }
          main[first_query_length+i] = sub
        }
        console.log(sub)
        res.json(main)
      }
    })
  }

  if(mode == 'add'){
    console.log("Client tries to add chat list")
    var sql_add = 'insert into Chat_room (room_id, buyer_id, seller_id, last_statement) values (?,?,?,?)'
    var params = [chat_room_id, user_buyer, user_seller, 'coming soon']
    connection.query(sql, function (err, rows, result) {
      if (err) {
        console.log(err)
      } else {
        for(var i = 0; i < rows.length; i++){
          var sub = {
            'parsed_id' : rows[i]._id,
            'parsed_img': rows[i].itemimg,
            'parsed_title': rows[i].itemtitle,
            'parsed_price': rows[i].itemprice,
            'parsed_description' : rows[i].itemdescription,
            'parsed_writer' : rows[i].writer,
            'parsed_date' : rows[i].date
          }
          main[i] = sub
        }
        res.json(main)
      }
    })
  }
})

//////////////////////////////////////////////// newFeature : 채팅 방 추가 ////////////////////////////////////////////////////////////////////
app.post('/chat/add_conversation', function (req, res) {
  console.log(req.body)
  var id = randomString(8)
  var userEmail = req.body.userEmail
  var userPwd = req.body.userPwd
  var userName = req.body.userName

  // 삽입을 수행하는 sql문.
  var sql = 'INSERT INTO Users (_id, UserEmail, UserPwd, UserName) VALUES (?, ?, ?, ?)'
  var params = [id, userEmail, userPwd, userName]

  // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
  connection.query(sql, params, function (err, result) {
    var resultCode = 404
    var message = '에러가 발생했습니다'

    if (err) {
      console.log(err)
    } else {
      resultCode = 200
      message = '회원가입에 성공했습니다.'
    }

    res.json({
      'code': resultCode,
      'message': message
    })
  })
})
//////////////////////////////////////////////// newFeature : 채팅 소켓 서버  ////////////////////////////////////////////////////////////////////

//https://mainia.tistory.com/5720
var server = http.createServer(app);

server.listen(3000,function () {
  console.log('서버 실행 중...')
})
//
// server.listen(3000,function(){
//   console.log("Chatserver is running....")
// })

var io = socketio.listen(server)

// var loginHistory = new Array();
// io.sockets.on('connection', function(socket){
//   var client_id;
//
//   socket.on('access', function(data){
//     // 채팅방 임시 실행
//     socket.leave(socket.id);
//     socket.join(data.room);
//
//     loginHistory.push({
//       socket : socket.id,
//       room : data.room,
//       user : data.name
//     })
// // 페이지 새로고침시 값 누적 안되도록 중복값 제거
// for var(num in loginHistory){
//   if(loginHistory[num]['user'] == data.name && loginHistory[num]['socket']!=socket.id){
//     loginHistory.splice(num, 1); // 해당 순서의 값 제거
//   }
// }
//
// //클라이언트의 contact 이벤ㅌ 실행 , 입상한 사용자 정보 출력 \
// io.sockets.in(data.room).emit('contact', {
//   count : io.sockets.adapter.rooms[data.room].length,
//   name : data.name
// })
// })
//
// //방 퇴장시(앱에서는 마지막 활동 시간 표시)
// socket.on("disconnect", function(){
//   var room = ""
//   var name = ""
//   var socket = ""
//   var count = 0;
//   //socket 정보 꺼내는데 에러 발생하고 노드 앱이 종료되니 예외처리를 해준다
//
//   try{
//     for (var key in io.sockets.adapter.rooms){ // 생성된 방 수만틈 반복문 돌리고,
//       var members = loginHistory.filter(function(chat){ // 로그인 배열 값만큼 반복문을 돌린다.
//         return chat.room === key;
//       })
//
//       if(io.sockets.adapter.rooms[key].length!= members.length){//소켓 방의 길이와 member 배열 길이가 일치하지 않는경우
//         //해당 loginHistory에 socket.id 존재여부 확인
//         for(var num in loginHistory){// 일치하는 소켓 id 없을 경우 사용자 방에서 퇴장한걸로 간주
//           if(io.sockets.adapter.rooms[key].socketshasOwnProperty(loginHistory[num]['socket'] == false){
//             room = key;
//             name  = loginHistory[num]['user'];
//
//             //퇴장한 사람 정보 제거
//             loginHistory.splice(num, 1);
//
//           }
//         }
//                       //
//       }
//     }
//   } catch(exception){
//     console.log(exception);
//   }
//   finally{
//     // 클라이언트의 contact 이벤트를 실행해서 이탈한 사용자 알리기
//     io.sockets.in(room).emit
//   }
// })
//
//
//
// })
//
//
// var loginHistory = new Array();
var client_id
var room_id
io.sockets.on('connection', function(socket){
  socket.on('client_id', function(data){
    client_id = data
    console.log('//////////////////// '+client_id+ ' :  Socket connected ///////////////')
  })

  var sql = 'select seller_id from Chat_room where buyer_id = ?'
  param= [client_id]
  var room_list = []
  connection.query(sql, param, function(err, rows, result){
    if(err){
      console.log(err)
    } else {
      for(var i = 0 ; i< rows.length; i++){
        room_list[i] = rows[i].seller_id
        console.log(room_list[i]);
      }
    }
  })

  socket.on('room_id_to_join', function(data){
    room_id = data
    console.log('//////////////////// '+client_id+ ' :  entered room '+room_id +'///////////////')
    socket.join(room_id)
  })

  socket.on('msg',function(data){
    socket.to(data.room_id).emit('msg_to_room',{'msg':data.message, 'date':"coming soon"})
    console.log(data)
  })


})
//////////////////////////////////////////////// 회원가입 ////////////////////////////////////////////////////////////////////
app.post('/user/join', function (req, res) {
  console.log(req.body)
  var id = randomString(8)
  var userEmail = req.body.userEmail
  var userPwd = req.body.userPwd
  var userName = req.body.userName

  // 삽입을 수행하는 sql문.
  var sql = 'INSERT INTO Users (_id, UserEmail, UserPwd, UserName) VALUES (?, ?, ?, ?)'
  var params = [id, userEmail, userPwd, userName]

  // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
  connection.query(sql, params, function (err, result) {
    var resultCode = 404
    var message = '에러가 발생했습니다'

    if (err) {
      console.log(err)
    } else {
      resultCode = 200
      message = '회원가입에 성공했습니다.'
    }

    res.json({
      'code': resultCode,
      'message': message
    })
  })
})

////////////////////////////////////////////////////// 로그인 //////////////////////////////////////////////////////
app.post('/user/login', function (req, res) {
  var autoLogin = req.body.is_autologin
  var userEmail = req.body.userEmail
  var userPwd = req.body.userPwd
  var sql_find_user = 'select * from Users where UserEmail = ?'
  var sql_online = 'update Users set isOnline= \'true\' where UserEmail = ?'
  var sql_set_true = 'update Users set enabledAutoLogin= \'true\' where UserEmail = ?'
  var sql_set_false = 'update Users set enabledAutoLogin = \'false\' where UserEmail = ?'
  var param = [userEmail]
  var param2 = [autoLogin, userEmail]
  var sql
  console.log(userEmail + ' pw:  '+ userPwd +'autoLogin : '+autoLogin+'로그인 시도중...')

  if(autoLogin == 'true'){
    sql = sql_set_true
  }
  if(autoLogin == 'false'){
    sql = sql_set_false
  }

  connection.query(sql_find_user, userEmail, function (err, result) {
    var resultCode = 404
    var message = '에러가 발생했습니다'

    if (err) {
      console.log(err)
    } else {
      if (result.length === 0) {
        resultCode = 204
        message = '존재하지 않는 계정입니다!'
      } else if (userPwd !== result[0].UserPwd) {
        resultCode = 204
        message = '비밀번호가 틀렸습니다!'
      } else {
        resultCode = 200
        message = '로그인 성공! ' + result[0].UserName + '님 환영합니다!'
        connection.query(sql_online,param)
        connection.query(sql,param)

      }
    }
    res.json({
      '_id' : result[0]._id,
      'nickname' : result[0].nickname,
      'email' : result[0].UserEmail,
      'code': resultCode,
      'message': message,
      'auto_login':result[0].enabledAutoLogin
    })
  })
})
//////////////////////////////////////////////////////////// DB에 아이템 추가/////////////////////////////////////////
app.post('/user/board', function (req, res) {

  console.log("Item Add Requested:",req.body)

  var id = randomString(8)
  var itemTitle = req.body.itemTitle
  var itemPrice = req.body.itemPrice
  var itemDescription = req.body.itemDescription
  var writer = req.body.writer
  var d = new Date() // 수정 필요
  var date = d.getFullYear() + "년" + d.getMonth()+"월" + d.getDate()+"일" + d.getHours()+"시" + d.getMinutes()+"분"+d.getSeconds() +"초"
  // 삽입을 수행하는 sql문.
  var sql = 'INSERT INTO Item (_id, itemtitle, itemprice, itemdescription,writer,date) VALUES (?, ?, ?, ?, ?, ?)'
  var params = [id,itemTitle, itemPrice, itemDescription,writer,d]

  // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
  connection.query(sql, params, function (err, result) {
    var resultCode = 404
    var message = '에러가 발생했습니다'

    if (err) {
      console.log(err)
    } else {
      resultCode = 200
      message = '아이템 등록이 완료되었습니다.'
    }

    itemidentifier = id

    res.json({
      'code': resultCode,
      'message': message
    })
  })
})

//UPDATE `example`.`Item` SET `itemimg` = 'ss' WHERE (`_id` = 'Ol8RGdxV')

///////////////////////////////////////////////클라이언트로부터 파일 수신/////////////////////////////////////////////////////////////
//https://www.zerocho.com/category/NodeJS/post/5950a6c4f7934c001894ea83
//https://m.blog.naver.com/PostView.nhn?blogId=pjt3591oo&logNo=220517017431&proxyReferer=https%3A%2F%2Fwww.google.com%2F
//http://jeonghwan-kim.github.io/%EC%9D%B4%EB%AF%B8%EC%A7%80-%EC%97%85%EB%A1%9C%EB%93%9C-1-multer-%EB%AA%A8%EB%93%88%EB%A1%9C-%ED%8C%8C%EC%9D%BC-%EC%97%85%EB%A1%9C%EB%93%9C/
//https://github.com/expressjs/multer/blob/master/doc/README-ko.md 멀터 설명
//https://github.com/WKDev/Retrofit-Sample#retrofit%EC%97%90%EC%84%9C-%EB%A9%80%ED%8B%B0%ED%8C%8C%ED%8A%B8-%ED%86%B5%EC%8B%A0%ED%95%98%EA%B8%B0

const multer = require('multer')

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images')
    },
    filename: function (req, file, cb) {
      cb(null, randomString(12) + ".jpg")
    }
  }),
})

app.post('/upload', upload.single('upload_file'), (req, res) => {
  var sql = 'update Item set itemimg = ? where (_id = \''+ itemidentifier+'\')'
  connection.query(sql, req.file.filename, function (err, result) {
    if(err){
      console.log(err)
    }
    else{
      console.log("\ncomplete adding img_name to DB")
    }

  })

  // console.log(req.body)
  console.log(" _id : " + itemidentifier+ "/ img_id : " + req.file.filename)
  console.log(req.file)
  res.json({})
})
////////////////////////////////////////////클라이언트로 파일 송신////////////////////////////////////////////////////////////////

app.use(express.static('images'))

// app.get('/download_img', (req,res)=>{
//   const file = '/home/ubuntu/images' + test.jpg
//   res.download(file)
// })
///////////////////////////////////////////DB에서 아이템 조회/////////////////////////////////////////
app.get('/user/inquiredata', function (req, res) {
  console.log("Client accessed.")
  var sql = 'select * from Item order by date desc'
  var main = []
  connection.query(sql, function (err, rows, result) {
    if (err) {
      console.log(err)
    } else {
      for(var i = 0; i < rows.length; i++){
        var sub = {
          'parsed_id' : rows[i]._id,
          'parsed_img': rows[i].itemimg,
          'parsed_title': rows[i].itemtitle,
          'parsed_price': rows[i].itemprice,
          'parsed_description' : rows[i].itemdescription,
          'parsed_writer' : rows[i].writer,
          'parsed_date' : rows[i].date
        }
        main[i] = sub
      }
      res.json(main)
    }
  })
})
/////////////////////////////////////////////////db에서 아이템 검색 ////////////////////////////////////////////////

app.post('/user/search', function (req, res) {
  var requestedText = req.body.search_title
  console.log("search Requested:",requestedText)
  var sql = 'select * from Item where itemtitle like (?)'
  var param = [requestedText]
  var main = []

  connection.query(sql, param, function (err, rows, result) {
    if (err) {
      console.log(err)
    } else {
      for(var i = 0; i < rows.length; i++){
        var sub = {
          'search_result_title': rows[i].itemtitle,
          'search_result_price': rows[i].itemprice,
          // 'search_result_description' : rows[i].ItemDescription,
          'search_result_writer' : rows[i].writer,
          'search_result_desc' : rows[i].itemdescription,
          'search_result_date' : rows[i].date,

        }
        main[i] = sub
        console.log(sub)
      }
      console.log("-------------------------------")
      console.log(main)
      res.json(main)
    }
  })
})
// 로그아웃
//
// app.post('/user/importdata', function (req, res) {
//   var user_id = req.body._id
//   var sql_state_update = 'select enabledAutoLogin from Users where _id = ?'
//   var param = [user_id]
//   connection.query(sql_state_update, param, function (err, result) {
//     var resultCode = 404
//     if (err) {
//       console.log(err)
//     } else {
//       console.log(user_id +' 의 autologin 값은 ' + result[0].enabledAutoLogin)
//     }
//
//     res.json({
//       'value': result[0].enabledAutoLogin,
//     })
//   })
// })
///////////////////////////////////////////////////autoLogin 상태 변경 ////////////////////////////////////////////////
app.post('/user/state', function (req, res) {
  var user_id = req.body._id
  var state_to_set = req.body.set_state
  var sql_set_true = 'update Users set enabledAutoLogin = \'true\' where _id = ?'
  var sql_set_false = 'update Users set enabledAutoLogin = \'false\' where _id = ?'
  var sql
  console.log('requested autologin state to :' + state_to_set)
  if(state_to_set =='true'){
    sql = sql_set_true
  }else{
    sql = sql_set_false
  }

  console.log(user_id +' : autoLogin state 변경 시도중...')

  connection.query(sql, user_id, function (err, result) {
    var resultCode = 404
    if (err) {
      console.log(err)
    } else {
      var resultCode = 200
    }

    res.json({
      'value': req.body.set_state
    })
  })
})
///////////////////////////////////////////////////로그아웃 ////////////////////////////////////////////////

app.post('/user/logout', function (req, res) {
  var user_id = req.body._id
  var sql_state_update = 'update Users set isOnline = \'false\' where _id = ?'
  var params = [user_id]
  console.log(user_id +'로그아웃 시도중')

  connection.query(sql_state_update, params, function (err, result) {
    var resultCode = 404
    if (err) {
      console.log(err)
    } else {
      var resultCode = 200
    }

    res.json({
      'code': resultCode
    })
  })
})
///////////////////////////////////////////////////Random_ID 생성////////////////////////////////////////////////

function randomString(randomstring) {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
  var string_length = 8
  for (var i=0;i<string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum,rnum+1)
  }
  return randomstring
}
