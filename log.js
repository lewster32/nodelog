var config = require('./config'),
	tc = require('./lib/consolelog/termcolors'),
	irc = require('./lib/irc');

var file = require('file'),
	path = require('path'),
	repl = require('repl'),
	sys = require('sys');

var logFile, day;
function writeLog(text, color) {

  text = text.replace(/((\x03)([0-9]*)(,?)([0-9]+))|[^(\x20-\xFF)]*/g,''); // strip out mIRC colour codes and other non-printable chars
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
  
  if ((typeof color == 'number') && (color >= 0) && (color <= 9)) {
    tc.terminalFontReset();
	tc.terminalSetFont(color, 9, 9);
  }
  sys.puts('('+time+') '+text);
  tc.terminalFontReset();
}

var client = new irc.Client(config.host, config.port);
client.connect(config.nick, config.user, config.real);

client.addListener('001', function() {
  if (config.perform.length > 0) {
	for (var p in config.perform) {
		this.send(config.perform[p]);
	}
  }
});

client.addListener('JOIN', function(prefix, channel) {
  writeLog('* Joins: '+irc.user(prefix).nick+' ('+irc.user(prefix).user+'@'+irc.user(prefix).host+')', 2);
});

client.addListener('PART', function(prefix, channel) {
  writeLog('* Parts: '+irc.user(prefix).nick+' ('+irc.user(prefix).user+'@'+irc.user(prefix).host+')', 4);
});

client.addListener('QUIT', function(prefix, message) {
  writeLog('* Quits: '+irc.user(prefix).nick+' ('+irc.user(prefix).user+'@'+irc.user(prefix).host+') ('+message+')', 4);
});

client.addListener('KICK', function(prefix, channel, nick, message) {
  writeLog('* '+nick+' was kicked by '+irc.user(prefix).nick+' ('+message+')', 4);
  if (nick == config.nick) {
	this.send('JOIN', config.channel);
  }
});

client.addListener('MODE', function(prefix, channel, modes, target) {
  target ? target = ' '+target : target = '';
  writeLog('* '+irc.user(prefix).nick+' sets mode: '+modes+target, 2);
});

client.addListener('TOPIC', function(prefix, channel, text) {
  writeLog('* '+irc.user(prefix).nick+' changes topic to \''+text+'\'', 1);
});

/*
client.addListener('NOTICE', function(prefix, message) {
  writeLog('-'+irc.user(prefix).nick+'- '+text, 1);
});
*/

client.addListener('PRIVMSG', function(prefix, channel, text) {
  switch (text) {
    case '!logs':
    case '!log':
      this.send('PRIVMSG', channel, ':Logs are here: '+config.logUrl);
      break;
  }
  if (text.match(/^\x01ACTION\s/)) {
	writeLog('* '+irc.user(prefix).nick+' '+text.replace(/^\x01ACTION\s/,''), 5);
  }
  else if (channel == config.nick) {
	writeLog('*'+irc.user(prefix).nick+'* '+text, 1);
  }
  else {
	writeLog('<'+irc.user(prefix).nick+'> '+text);
  }
});

repl.start(config.real+"> ");