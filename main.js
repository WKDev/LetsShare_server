var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
multer = require('multer')
path = require('path');
crypto = require('crypto');
var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.listen(3000,function () {
    console.log('서버 실행 중...');
});





var connection = mysql.createConnection({
    host: 'tbkdatabase3.c0eh6nyw1fpk.ap-northeast-2.rds.amazonaws.com',
    user: 'admin',
    database: 'example',
    password: '12345678',
    port: 8080
});
// 회원가입
app.post('/user/join', function (req, res) {
    console.log(req.body);
    var id = randomString();
    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var userName = req.body.userName;

    // 삽입을 수행하는 sql문.
    var sql = 'INSERT INTO Users (_id, UserEmail, UserPwd, UserName) VALUES (?, ?, ?, ?)';
    var params = [id, userEmail, userPwd, userName];

    // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '회원가입에 성공했습니다.';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});
// 로그인
app.post('/user/login', function (req, res) {
    var autoLogin = req.body.is_autologin;
    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var sql_find_user = 'select * from Users where UserEmail = ?';
    var sql_online = 'update Users set isOnline= \'true\' where UserEmail = ?';
    var sql_set_true = 'update Users set enabledAutoLogin= \'true\' where UserEmail = ?';
    var sql_set_false = 'update Users set enabledAutoLogin = \'false\' where UserEmail = ?';
    var param = [userEmail];
    var param2 = [autoLogin, userEmail];
    var sql;
    console.log(userEmail + ' pw:  '+ userPwd +'autoLogin : '+autoLogin+'로그인 시도중...');

    if(autoLogin == 'true'){
      sql = sql_set_true;
    }
    if(autoLogin == 'false'){
      sql = sql_set_false;
    }

    connection.query(sql_find_user, userEmail, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) {
                resultCode = 204;
                message = '존재하지 않는 계정입니다!';
            } else if (userPwd !== result[0].UserPwd) {
                resultCode = 204;
                message = '비밀번호가 틀렸습니다!';
            } else {
                resultCode = 200;
                message = '로그인 성공! ' + result[0].UserName + '님 환영합니다!';
                connection.query(sql_online,param);
                connection.query(sql,param);

            }
        }
        res.json({
            '_id' : result[0]._id,
            'nickname' : result[0].nickname,
            'email' : result[0].UserEmail,
            'code': resultCode,
            'message': message,
            'auto_login':result[0].enabledAutoLogin
        });
    })
});
// DB에 아이템 추가
app.post('/user/board', function (req, res) {

  console.log("Item Add Requested:",req.body);

  var id = randomString();
  var itemTitle = req.body.itemTitle;
  var itemPrice = req.body.itemPrice;
  var itemDescription = req.body.itemDescription;
  var writer = req.body.writer;
  var d = new Date(); // 수정 필요
  var date = d.getFullYear() + "년" + d.getMonth()+"월" + d.getDate()+"일" + d.getHours()+"시" + d.getMinutes()+"분"+d.getSeconds() +"초";
    // 삽입을 수행하는 sql문.
    var sql = 'INSERT INTO Item (_id, itemtitle, itemprice, itemdescription,writer,date) VALUES (?, ?, ?, ?, ?, ?)';
    var params = [id,itemTitle, itemPrice, itemDescription,writer,d];

    // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '아이템 등록이 완료되었습니다.';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});
//DB에서 아이템 조회
app.get('/user/inquiredata', function (req, res) {
  console.log("Item List Requested");
  var sql = 'select * from Item';
  var main = [];
    connection.query(sql, function (err, rows, result) {
        if (err) {
            console.log(err);
        } else {
            for(var i = 0; i < rows.length; i++){
                var sub = {
                    'parsed_id' : rows[i]._id,
                    'parsed_title': rows[i].itemtitle,
                    'parsed_price': rows[i].itemprice,
                    'parsed_description' : rows[i].itemdescription,
                    'parsed_writer' : rows[i].writer,
                    'parsed_date' : rows[i].date,
                }
                main[i] = sub;
            }
        var jsonObject = {main};
        res.json(main);
                }
          });
        });

app.post('/user/search', function (req, res) {
          var requestedText = req.body.search_title;
          console.log("search Requested:",requestedText);
          var sql = 'select * from Item where itemtitle like (?)';
          var param = [requestedText];
          var main = [];

            connection.query(sql, param, function (err, rows, result) {
                if (err) {
                    console.log(err);
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
                        main[i] = sub;
                        console.log(sub);
                    }
                    console.log("-------------------------------");
                console.log(main);
                res.json(main);
              }
                  });
                });
                // 로그아웃
//
// app.post('/user/importdata', function (req, res) {
//   var user_id = req.body._id;
//   var sql_state_update = 'select enabledAutoLogin from Users where _id = ?';
//   var param = [user_id];
//   connection.query(sql_state_update, param, function (err, result) {
//     var resultCode = 404;
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(user_id +' 의 autologin 값은 ' + result[0].enabledAutoLogin);
//     }
//
//     res.json({
//       'value': result[0].enabledAutoLogin,
//     });
//   });
// });

app.post('/user/state', function (req, res) {
  var user_id = req.body._id;
  var state_to_set = req.body.set_state;
  var sql_set_true = 'update Users set enabledAutoLogin = \'true\' where _id = ?';
  var sql_set_false = 'update Users set enabledAutoLogin = \'false\' where _id = ?';
  var sql;
  console.log('requested autologin state to :' + state_to_set);
  if(state_to_set =='true'){
    sql = sql_set_true;
  }else{
    sql = sql_set_false;
  }

  console.log(user_id +' : autoLogin state 변경 시도중...');

  connection.query(sql, user_id, function (err, result) {
    var resultCode = 404;
    if (err) {
      console.log(err);
    } else {
      var resultCode = 200;
    }

    res.json({
      'value': req.body.set_state
    });
  });
});

app.post('/user/logout', function (req, res) {
  var user_id = req.body._id;
  var sql_state_update = 'update Users set isOnline = \'false\' where _id = ?';
  var params = [user_id];
  console.log(user_id +'로그아웃 시도중');

  connection.query(sql_state_update, params, function (err, result) {
    var resultCode = 404;
    if (err) {
      console.log(err);
    } else {
      var resultCode = 200;
    }

    res.json({
      'code': resultCode
    });
  });
});

function randomString() {
var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
var string_length = 8;
var randomstring = '';
for (var i=0; i<string_length; i++) {
var rnum = Math.floor(Math.random() * chars.length);
randomstring += chars.substring(rnum,rnum+1);
}
return randomstring;
}
