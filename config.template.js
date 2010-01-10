process.mixin(exports, {
  host: 'localhost',
  port: 6667,
  nick: 'nodelog',
  user: 'nodelog',
  real: 'NodeLog',
  channel: '#nodejs',
  logUrl: 'http://nodejs.debuggable.com/',
  logPath: 'log',
  perform: [
	"PRIVMSG NickServ :IDENTIFY password"
  ]
});