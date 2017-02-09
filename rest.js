var Client = require("node-rest-client").Client;
var fs = require('fs');

// 負荷条件
var dashboardInfo = require("./dashboard.json");     // ダッシュボード情報
var args = require("./args.json");		// 送信間隔、送信回数等
var interval = args.interval ; 			// リクエスト送信間隔[msec]
var repeat = args.repeat ; 				// リクエスト送信回数[回]
var logpath = args.logpath ;			// ログファイル名先頭部分
var description = args.description; 	// 始動時に表示するコメント


console.log("--- <" + description + "> Interval=" + interval + " [msec], Repeat=" + repeat + " [times] ---");
console.log("    log file=" + logpath + "YYYY-MM-DD.log");
logWrite(logpath,"--- <" + description + "> Interval=" + interval + " [msec], Repeat=" + repeat + " [times] ---");
logWrite(logpath,"    log file=" + logpath + "YYYY-MM-DD.log");

// ダッシュボードへのGETリクエスト用HTTPクライアントの初期化
var dashboardClient = new Array();
var requestHandler = new Array();
for (var i=0 ; i<dashboardInfo.length ; i++ ){
    dashboardClient[i] = new Client();
    dashboardClient[i].registerMethod("jsonMethod", dashboardInfo[i].url, "GET");
    requestHandler[i] = null;
	// handling client error events
	dashboardClient[i].on('error', function (err) {
	    console.error(dateFmt(new Date()) + " ***ERROR in node-rest-client\n", err);
	});
	console.log(dateFmt(new Date()) + " Target=" + dashboardInfo[i].name + " URL=" + dashboardInfo[i].url);
	logWrite(logpath,dateFmt(new Date()) + " Target=" + dashboardInfo[i].name + " URL=" + dashboardInfo[i].url);
}

console.log("---");
logWrite(logpath,"---");


// ダッシュボードへのGETリクエストをを一定間隔で送信
var count = 0;
var status = null;
var startTime = null;
var message = new Array();
var tat = new Array();
var loop = setInterval(function(){
	count++;
	startTime = new Date();
	for (var i=0 ; i<dashboardInfo.length ; i++ ){
	    requestHandler[i] = dashboardClient[i].methods.jsonMethod( function (data, response) {
	    tat[i] = ("00000" + (new Date() - startTime)).slice(-6);
	    status = ( response.statusCode === 200 ) ? "OK" : "NG";
	    message[i] = dateFmt(startTime) + " RC=" + response.statusCode + "[" + status + "], TAT=" + tat[i] + "[msec], ";
	    message[i] = message[i] + "Count=" + (count+"        ").substr(0,8) + ", target=" + response.client._host;
//	    console.log(message[i]);
		logWrite(logpath,message[i]);
	    });
	    // handling specific req errors
	    requestHandler[i].on('error', function (err) {
	    	console.error(dateFmt(new Date()) + " ***ERROR Count=" + count + " in node-rest-client GET request.\n", err.request.options);
	    });
	}

	if(count===repeat){
		clearInterval(loop);
		}
	},interval);


// 日付フォーマット用関数
function dateFmt(dt){
    return dt.toISOString().replace(/T/," ").replace(/Z/,"");
}


// ログ出力用関数
function logWrite(p,st){
	st = st + "\n";
	fs.appendFile(p + (new Date()).toISOString().substr(0,10) + ".log", st, 'utf8', function (err) {
		if(err){
		    console.log(dateFmt(new Date()) + " ***ERROR in function 'logWrite'. Path='" + p + "'\n" + err);
		}
	});
}
