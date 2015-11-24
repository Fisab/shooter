var express = require('express');
var expressWs = require('express-ws');
var path = require('path');
var app = express();
expressWs(app);

app.use(express.static('client'));

var port = process.env.PORT || 7777;

app.set('views', path.join(__dirname, 'views'));

var players = [];
var clients = [];
var bullets = [];
var tick = 0;
var terrarians = [];
var grenades = [];
console.log('Successfully started');

function checkCollisionBullet(){
	loop1: for(var j = 0; j < bullets.length; ++j){
		if(bullets[j].pos[0] > 2000 || bullets[j].pos[0] < 0 || bullets[j].pos[1] > 2000 || bullets[j].pos[1] < 0){
			bullets.splice(j--, 1);
			continue;
		}
		for(var m = 0; m < terrarians.length; ++m){
			if(	bullets[j].pos[0]+5 > terrarians[m].pos[0] &&
				bullets[j].pos[0]-5 < terrarians[m].pos[0]+terrarians[m].size[0] &&
				bullets[j].pos[1]+5 > terrarians[m].pos[1] &&
				bullets[j].pos[1]-5 < terrarians[m].pos[1]+terrarians[m].size[1]
			){
				bullets.splice(j--, 1);
				continue loop1;
			}
		}
		for(var i = 0; i < players.length; ++i){
			if(	bullets[j].pos[0]+5 > players[i].pos[0]-players[i].size &&
				bullets[j].pos[0]-5 < players[i].pos[0]+players[i].size &&
				bullets[j].pos[1]+5 > players[i].pos[1]-players[i].size &&
				bullets[j].pos[1]-5 < players[i].pos[1]+players[i].size &&
				players[i].name != bullets[j].owner
			){
				bullets.splice(j--, 1);
				players.splice(i--, 1);
				continue loop1;
			}
		}
	}
}

function checkCollisionGrenade(){
	for(var terrarian of terrarians){
		for(var grenade of grenades){
			if(	grenade.pos[0]+10 > terrarian.pos[0] &&
				grenade.pos[0]-10 < terrarian.pos[0]+terrarian.size[0] &&
				grenade.pos[1]+10 > terrarian.pos[1] &&
				grenade.pos[1]-10 < terrarian.pos[1]+terrarian.size[1] 
				){
				grenade.vel[1] = -grenade.vel[1]-1;
				if(terrarian.size[0] < terrarian.size[1]){
					grenade.vel[0]*=-1;
				}
			}
		}
	}
}
var boomRadius = 70;
function boom(){
	for(var grenade of grenades){
		if(players.length > 0){
			for(var player of players){
				if(grenade.times == 0 || player.remoteBoom){
					grenade.size+=2;
					if(	grenade.pos[0]+grenade.size > player.pos[0]-player.size &&
						grenade.pos[0]-grenade.size < player.pos[0]+player.size &&
						grenade.pos[1]+grenade.size > player.pos[1]-player.size &&
						grenade.pos[1]-grenade.size < player.pos[1]+player.size
						){
						players.splice(player, 1);
					}
					if(grenade.size > boomRadius){
						grenades.splice(grenade, 1);
						player.remoteBoom = false;
					}

				}
			}
		}
		else{
			grenade.size+=2;
			if(grenade.size > boomRadius){
				grenades.splice(grenade, 1);
			}
		}
		if(grenade.times){
			grenade.times-=1;
		}
	}
}

function mainLoop(){
	boom();
	checkCollisionGrenade();
	checkCollisionBullet();
	for(var grenade of grenades){
		if(grenade.vel[1] < 7 && grenade.vel[1] > -7){		
			grenade.vel[1]+=0.02;
		}
		grenade.vel[1]+=0.7;
		if(grenade.exploding){
			grenade.vel[1]*=0.994;
			grenade.vel[0]*=0.992;

		}
		grenade.pos[0]+=grenade.vel[0];
		grenade.pos[1]+=grenade.vel[1];
	}
	for(var bullet of bullets){
		bullet.pos[0]+=bullet.vel[0];
		bullet.pos[1]+=bullet.vel[1];
	}
}

app.ws('/', function(ws, req){
	var user = null;
	ws.onmessage = function(s){
		try{
			var msg = JSON.parse(s.data);
			switch(msg.type){
				case 'spectator':
				break;
				case 'remoteBoom':
					for(var player of players){
						if(msg.player == player.name){
							for(var grenade of grenades){
								if(player.name == grenade.owner){	
									player.remoteBoom = true;
								}
							}
						}
					}
				break;
				case 'chat':
					user.message = msg.text;
					for(var client of clients){
						client.send(JSON.stringify({
							type: 'chat',
							name: msg.name,
							text: msg.text,
						}));
					}
					console.log(msg.nick+': '+msg.text);
				break;
				//socket.send(JSON.stringify({type: 'enter1'}))
				case 'enter1':
					console.log('enter1');
					for(var i = 0; i < 2000; i+=10){
						var k = 0;
						var speed = 10;
						grenades.push({
							type: 'grenade',
							pos: [i, 10],
							vel: [Math.cos(k)*speed, Math.sin(k)],
							color: '#' + Math.floor(Math.random()*16777215).toString(16),
							exploding: false
						});
					}
				break;
				case 'grenade':
					for(var player of players){
						if(player.name == msg.name){
							msg = player;
							break;
						}
					}
					if(msg.color){
						var t = msg.angle;
						var speed = 10;
						grenades.push({
							type: 'grenade',
							pos: msg.pos.slice(0),
							vel: [Math.cos(t)*speed, Math.sin(t)],
							owner: msg.name,
							color: msg.color,
							size: 7,
							exploding: true,
							times: 200
						});
					}
				break;
				case 'bullet':
					for(var player of players){
						if(player.name == msg.name){
							msg = player;
							break;
						}
					}
					if(msg.color){
						var a = msg.angle;
						var speed = 10;
						bullets.push({
							type: 'bullet',
							pos: msg.pos.slice(0),
							vel: [Math.cos(a)*speed, Math.sin(a)*speed],
							owner: msg.name,
							color: msg.color,
							angle: a
						});
					}
				break;
				default:
					if(!user){
						user = msg.player;
						players.push(user);
						clients.push(ws);
						if(terrarians.length == 0){terrarians = msg.terrarians;}
					}
					for(var player of players){
						if(player.name == msg.name){
							player.pos = msg.pos;
							player.vel = msg.vel;
							player.angle = msg.angle;
						}
					}
			}
			ws.send(JSON.stringify({type: 'bullet', bullets: bullets}));
			ws.send(JSON.stringify({type: 'grenade', grenades: grenades}));
			remoteBoomSend = true;
		}
		catch(e){
			console.log(e);
		}
		ws.send(JSON.stringify(players));
	}
	ws.onclose = function(){
		if(players.indexOf(user) !== -1)
			players.splice(players.indexOf(user), 1);
		clients.splice(clients.indexOf(ws), 1);
	}
});
app.listen(port);
setInterval(function(){mainLoop();}, 16);
