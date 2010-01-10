process.mixin(require('sys'));
var config = require('./config');

var irc = require('./lib/irc');
var file = require('file');
var path = require('path');
var repl = require('repl');
var sys = require('sys');

var logFile, day;
function writeLog(text) {
  text = text.replace(/[^(\x20-\xFF)]*/g,'');
  var date = new Date;
  var today = [
     date.getFullYear(),
     // Poor man's zero padding FTW
     ('0'+(date.getMonth()+1)).substr(-2),
     ('0'+date.getDate()).substr(-2),
  ].join('-');

  if (!logFile || day !== today) {
    logFile = new file.File(path.join(config.logPath, today+'.txt'), 'a+', {encoding: 'utf8'});
    day = today;
  }
  
  var time = [
    ('0'+date.getHours()).substr(-2),
    ('0'+date.getMinutes()).substr(-2),
    ('0'+date.getSeconds()).substr(-2)
  ].join(':');
  
  logFile.write('('+time+') '+text+"\n");
  sys.puts('('+time+') '+text);
}

var client = new irc.Client(config.host, config.port);
client.connect(config.user);

client.addListener('001', function() {
  this.send('JOIN', config.channel);
});

client.addListener('JOIN', function(prefix, channel) {
  writeLog('* Joins: '+irc.user(prefix).nick+' ('+irc.user(prefix).user+'@'+irc.user(prefix).host+')');
});

client.addListener('PART', function(prefix, channel) {
  writeLog('* Parts: '+irc.user(prefix).nick+' ('+irc.user(prefix).user+'@'+irc.user(prefix).host+')');
});

client.addListener('QUIT', function(prefix, message) {
  writeLog('* Quits: '+irc.user(prefix).nick+' ('+irc.user(prefix).user+'@'+irc.user(prefix).host+') ('+message+')');
});

client.addListener('KICK', function(prefix, channel, nick, message) {
  writeLog('* '+nick+' was kicked by '+irc.user(prefix).nick+' ('+message+')');
  if (nick == config.user) {
	this.send('JOIN', config.channel);
  }
});

client.addListener('MODE', function(prefix, channel, modes, target) {
  target ? target = ' '+target : target = '';
  writeLog('* '+irc.user(prefix).nick+' sets mode: '+modes+target);
});

client.addListener('PRIVMSG', function(prefix, channel, text) {
  switch (text) {
    case '!source':
    case '!src':
      this.send('PRIVMSG', channel, ':Source is here: '+config.srcUrl);
      break;
    case '!logs':
    case '!log':
      this.send('PRIVMSG', channel, ':Logs are here: '+config.logUrl);
      break;
  }
  if (text.match(/^\x01ACTION\s/)) {
	writeLog('* '+irc.user(prefix).nick+' '+text.replace(/^\x01ACTION\s/,''));
  }
  else {
	writeLog('<'+irc.user(prefix).nick+'> '+text);
  }
});

repl.start("logbot> ");