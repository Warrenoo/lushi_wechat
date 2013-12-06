
/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var util = require('util');
var fuzzy = require('fuzzy');
var pinyin = require("pinyin2");
var lushistore = require('json-store')(__dirname + '/db/index.json');
var _ = require('underscore');
var lushidb = _.values(lushistore.get('hs_cards'));
// var routes = require('./routes');
// var user = require('./routes/user');
// var http = require('http');
// var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 22014);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

lushidb = lushidb.filter(function(ld) { return ld['所属卡牌集'] != '开发人员' && ld['所属卡牌集'] != '暴雪作弊专用'; });

var wechat = require('wechat');
var types_arr = [['仆从', '仆从'], ['法术', '法术'], ['法术效果', '法术效果'], ['武器', '武器'], ['英雄能力', '英雄能力']];
var types_attr = ['卡牌名称','英文名称','所属卡牌集','卡牌类型','职业','种族','稀有度','能源消耗','攻击力','生命值','手牌牌面注释','场上牌面注释','特色描述','指向目标注释','分解获得','合成需要','特性信息']
var types_arr_r = {};
types_arr.map(function(t) { return types_arr_r[t[1]] = t[0] });

app.use(express.query());
app.use('/wechat',
	wechat('wx2').text(function (message, req, res, next) {
    // console.log(pinyin('卡牌名称', {style: pinyin.STYLE_NORMAL}).map(function(py){ return py[0].charAt(0) }));  
	  var reply_arr = [];
      console.add = function(msg) {
        console.log(msg);
        reply_arr = reply_arr || [];
        reply_arr.push(msg);
      }

      var q = message.Content;
      var done = 0;
      console.log("输入：" + q);
      
      _.each(types_arr, function(ka) {
        if (q === ka[0]) {
          console.add(wrap_name(ka[1]) + "我发现了不少东西哦：");
          var results = lushidb.filter(function(ld) { return ld['卡牌类型'] == ka[1]; });
          results.slice(0, 60).map(function(z) {
            console.add(wrap_name(z['卡牌类型']||'') + z['卡牌名称']);
          });
          console.add("------")
          console.add("输入 '先知维纶'或者'xzwl'，即得 卡牌【先知维纶】\n");
          
          done = 1;
        }
      });


      //帮助
      if (q === "h"){
        res.reply("来找找你的卡牌吧！/:rose/:rose/:rose\n输入 '先知维纶'或者'xzwl'，即得 卡牌【先知维纶】\n你也可以输入" + types_arr.map(function(z) { return wrap_name(z[0]); }).join('、') + "这些词试试！/:8-)/:8-)/:8-)");
        return;
      }
      
      //输入字符过少
      if (q.length <= 1){
      	res.reply("你输入的东西太少啦，多给我一点提示吧。(提示请输入【h】)/::$");
        return;
      }

      //满足查询条件后进行查询
      if (!done) {
        var results = fuzzy.filter(q, lushidb, { extract: function(el) { return el['卡牌名称'] + " | " + pinyin(el['卡牌名称'], {style: pinyin.STYLE_NORMAL}).map(function(py){ return py[0].charAt(0) }).join(''); } });
        for (x in results)
        {
          console.log(results[x]);
        }
        
        if (!results.length) {
          res.reply("什么也没找到/::~，是不是输入有误呢？/:8*\n------\n提示请输入【h】");
          return;
        }

        if (results.length > 5) {
          console.add("/:,@@/:,@@/:,@@/:,@@/:,@@/:,@@\n我发现了不少东西哦：");
          for(var n in types_arr){
            results.slice(0, 200).map(function(r) {
            var z = r.original;
            if (z['卡牌类型'] == types_arr[n][0]){
              console.add(wrap_name(z['卡牌类型']||'') + z['卡牌名称']);
            }  
          });
          }
          console.add("-------");
          console.add("客官要看哪一个呢，输入【全称】或者【拼音首字母】告诉我吧？/::P/::P/::P");
        }

        if (results.length < 6) {

          var ni = 0;

          if (results.length > 1) {
            console.add("搜索到情报" + ("零一两三四五六七八九".split(''))[results.length] + "枚：");
            ni = 1;
          }

          results.map(function(r) {
            var d = r.original;

            if (ni) {
              console.add('-------- < ' + ni + ' > --------');
            }

            // if (ni < 2) {
                console.add(wrap_name(d['卡牌类型']||'') + d['卡牌名称']);
                console.add('-------');
                types_attr.map(function(k) {
                    if ((d[k] || []).length) {
                      if (d[k] != null){
                       console.add(wrap_name(k) + d[k]); 
                      }  
                    }
                  });
            // } else {
            //   console.add(wrap_name(types_arr_r[d['卡牌类型']]) + d['卡牌名称']);
            // }
            ni++;
          });

        }
      }
      
      var rstr = reply_arr.join("\n");    
      res.reply(rstr);
	})
.event(function (message, req, res, next) {
      var weixin = req.weixin;
      console.log("获得消息：" + util.inspect(weixin));
      if (weixin.Event == "subscribe") {
        res.reply("客官您好，欢迎使用炉石传说卡牌助手，这里有全部的炉石传说游戏数据，方便您随时查询哦！/:rose/:rose/:rose\n输入 先知维纶或者xzwl，即得 卡牌【先知维纶】\n嗯，就这么简单！/:8-)/:8-)/:8-)")
      } else {
        if (weixin.Event == "unsubscribe") {
          res.reply("一定要走吗？/:P-(/:P-(，我，谢谢你！")
        };
      };
    })
    .middlewarify()
);

// Routes
function wrap_name(name) {
  return name.length ? "【" + name + "】" : ''
}

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

app.configure('production', function(){
  app.use(express.errorHandler());
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
