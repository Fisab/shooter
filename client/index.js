var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');
var w = canvas.width = 2000;
var h = canvas.height = 2000;
document.body.style.overflow = "hidden"
var players = [];
var terrarians = [];
var keys = new Set();
var tick = 0;
var socket;
var me;
var numb = '0123456789';
var id = '';
var opacity = 1;
var mousePos;
var bullets = [];
var grenades = [];
var canShoot = true;
var canThrow = true;
var tickThrow = 0;
var generate = function() {
  for (var i = 0; i < 4; i++) {
    id += numb.charAt(Math.floor(Math.random() * numb.length));
  }
  return id;
}

function initialize(){
	var f = 0.2;
    for(var i = 0.25; i < 1; i+=0.20){
    	f+=0.05;
		terrarians.push({
			type: 'platform',
			color: '#413A23',
			pos: [w*i, h*f],
			size: [300, 20]
		});
	}
	var t = 0.63;	
	for(var i = 0.25; i < 0.80; i+=0.2){
    	t-=0.06;
		terrarians.push({
			type: 'platform',
			color: '#413A23',
			pos: [w*i, h*t],
			size: [300, 20]
		});
	}
	var q = 0.56;
    for(var i = 0.45; i < 1; i+=0.2){
    	q+=0.06;
		terrarians.push({
			type: 'platform',
			color: '#413A23',
			pos: [w*i, h*q],
			size: [300, 20]
		});
	}
	var k = 0.98;
	for(var i = 0.25; i < 0.80; i+=0.2){
    	k-=0.06;
		terrarians.push({
			type: 'platform',
			color: '#413A23',
			pos: [w*i, h*k],
			size: [300, 20]
		});
	}
	terrarians.push({//floor
		type: 'platform',
		color: '#413A23',
		pos: [0, h-100],
		size: [w, 50]
	});
	terrarians.push({//right
		type: 'platform',
		color: '#413A23',
		pos: [-19, 0],
		size: [20, h]
	});
	terrarians.push({//left
		type: 'platform',
		color: '#413A23',
		pos: [w, 0],
		size: [20, h]
	});
	me = {
		nick: '',
		name: generate(),
		color: '#' + Math.floor(Math.random()*16777215).toString(16),
		pos: [w/2, h*0.25],
		vel: [0,0],
		size: 15,
	};
	me.weapon = {
		numb: 1
	};
	console.log(me.weapon.numb);
	socket = new WebSocket("ws://89.178.25.192:7777");
	socket.onopen = function(){
        socket.send(JSON.stringify({player: me, terrarians: terrarians}));
    }
	me.chatOpen = false;
    socket.onmessage = function(p){
		var list = [];
		var data = JSON.parse(p.data);
		switch(data.type){
			case 'grenade':
				grenades = data.grenades;
			case 'chat':
				opacity = 1;
			break;
			case 'bullet':
				bullets = data.bullets;
			break;
			default:
				for(var i in data){
					if(data[i].name == id){
						list.push(me);
						me.message = data[i].message;
					}
					else{
						list.push(data[i]);
					}
				}
				players = [];
				players = list;
		}
    }
	document.body.addEventListener('keydown', function(e){
	    keys.add(e.which);
	    switch(e.which){
	    	case 52:
	    		me.weapon.numb = 4;
	    	break;
	    	case 49:
	    		me.weapon.numb = 1;
	    	break;
	    }
	    if(e.which == 13){
	    	chat();
	    }
	});
	document.body.addEventListener('keyup', function(e){
		if(keys.has(69)){
			socket.send(JSON.stringify({type: 'remoteBoom', player: me.name}));
		}
		if(keys.has(52)){
			socket.send(JSON.stringify({type: 'weapon', player: me.name, which: 4}));
		}
		if(keys.has(49)){
			socket.send(JSON.stringify({type: 'remoteBoom', player: me.name}));
		}
	    keys.delete(e.which);
	});
	canvas.addEventListener('mousemove', function(e){
		mousePos = [e.layerX, e.layerY];
	});
	canvas.addEventListener('click', function(e){
		switch(me.weapon.numb){
			case 1:	
				if(canShoot){
					socket.send(JSON.stringify({type: 'bullet', name: me.name}));
					canShoot = false;
					tick = 0;
				}
			break;
			case 4:
				if(canThrow){
					socket.send(JSON.stringify({type: 'grenade', name: me.name}));
					canThrow = false;
					tickThrow = 0;
				}
			break;
		}
	});
}

function ticker(can, ticks){
	if(!canThrow && tickThrow != ticks){
		tickThrow++;
	}
	else{
		canThrow = true;
	}
}

function resetShoot(){
	if(!canShoot && tick != 20){
		tick++;
	}
	else{
		canShoot = true;
	}
}

function checkCollisionLeft(me, terrarian){
	return(	me.pos[0]-me.size-10 < terrarian.pos[0]+terrarian.size[0] &&
			me.pos[0]+me.size > terrarian.pos[0]+terrarian.size[0] &&
			me.pos[1] > terrarian.pos[1] &&
			me.pos[1] < terrarian.pos[1]+terrarian.size[1] &&
			me.pos[1]+me.size > terrarian.pos[1] &&
			me.pos[1]-me.size < terrarian.pos[1]+terrarian.size[1]
		);
}

function chat(){
	me.chatOpen = true;
	var chat = document.getElementById('input');
	chat.style.left = me.pos[0]+me.size+'px';
	chat.style.top = me.pos[1]+'px';
	chat.style.background = '#fff';
	input.style.display = input.style.display === 'block' ? 'none' : 'block';
	chat.focus();
	if(input.style.display === 'none'){
		me.chatOpen = false;
		socket.send(JSON.stringify({type: 'chat', name: me.nick, text: input.value}));
		input.value = '';
	}
}

function checkCollisionRight(me, terrarian){
	return(	me.pos[1] > terrarian.pos[1] &&
			me.pos[1] < terrarian.pos[1]+terrarian.size[1] &&
			me.pos[1]+me.size > terrarian.pos[1] &&
			me.pos[1]-me.size < terrarian.pos[1]+terrarian.size[1] &&
			me.pos[0]-me.size < terrarian.pos[0] &&
			me.pos[0]+me.size+10 > terrarian.pos[0]
		);
}

function controlUnit(){
		me.collisionLeft = 0;
		me.collisionRight = 0;
		for(var terrarian of terrarians){
			if(checkCollisionLeft(me, terrarian)){me.collisionLeft+=1;}
			if(checkCollisionRight(me, terrarian)){me.collisionRight+=1;}
		}
		if(keys.has(32) && me.onFloor && !me.chatOpen){//jump
			for(var i = 0; i < 4; i++){
				if(me.onFloor){
					me.vel[1]-=4;
				}
			}
		}
		if(keys.has(65) && !me.collisionLeft && !me.chatOpen){//left
			me.vel[0]-=5;
		}
		if(keys.has(68) && !me.collisionRight && !me.chatOpen){//right
			me.vel[0]+=5;
		}
}

function checkOnPlatform(me, terrarian){
	return(	me.pos[0]+me.size > terrarian.pos[0] &&
			me.pos[0]-me.size < terrarian.pos[0]+terrarian.size[0] &&
			me.pos[1]+me.size > terrarian.pos[1] &&
			me.pos[1]-me.size < terrarian.pos[1]+terrarian.size[1]
		);
}

function processGame(){
		if(opacity > 0){opacity*=0.99;}
		var checkedOnFloor = 0;
        me.pos[0]+=me.vel[0];
        me.pos[1]+=me.vel[1];
        for(var bullet of bullets){
	        bullet.pos[0]+=bullet.vel[0];
	        bullet.pos[1]+=bullet.vel[1];
	    }
        if(!me.onFloor){
        	me.vel[0] *= 0.25;
        }
		for(var terrarian of terrarians){
			if(checkOnPlatform(me, terrarian)){checkedOnFloor += 1}
		}
        me.onFloor = checkedOnFloor;
        if(checkedOnFloor){
            me.pos[1] -= me.vel[1];
            me.vel[0] *=0.25;
			me.vel[1] *=0.25;
        }
        else{
            me.vel[1] += 1;
        }
}

function renderGame(){
	if(mousePos){
		var x = mousePos[0]- me.pos[0];
		var y = mousePos[1] - me.pos[1];
		me.angle = Math.atan2(y,x);
	}
	ctx.clearRect(0,0, w,h);
	for(var player of players){
		ctx.save();
		ctx.beginPath();
		ctx.translate(player.pos[0], player.pos[1]);
		ctx.rotate(player.angle);
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, me.size*2, 10);
		ctx.restore();
		ctx.fill();
		ctx.beginPath();
		ctx.fillStyle = player.color;
		ctx.arc(player.pos[0], player.pos[1], player.size, 0,Math.PI*2, 0);
		ctx.fill();
		if(player.message){
			ctx.beginPath();
			ctx.fillStyle = 'rgba(130, 82, 48, '+opacity+')';
			ctx.font = "italic 20pt Arial";
			ctx.fillText(player.message, player.pos[0]+player.size, player.pos[1]-player.size);
			ctx.fill();
		}
	}
	for(var bullet of bullets){
		ctx.save();
		ctx.beginPath();
		ctx.translate(bullet.pos[0], bullet.pos[1]);
		ctx.rotate(bullet.angle);
		ctx.fillStyle = bullet.color;
		ctx.fillRect(0,0, 15, 6);
		ctx.fill();
		ctx.restore();
	}
	for(var grenade of grenades){
		ctx.beginPath();
		ctx.fillStyle = grenade.color;
		ctx.arc(grenade.pos[0], grenade.pos[1], grenade.size, 0, Math.PI*2, 0);
		ctx.fill();
	}
	for(var terrarian of terrarians){
		ctx.beginPath();
        ctx.fillStyle = terrarian.color;
        ctx.strokeRect(terrarian.pos[0], terrarian.pos[1], terrarian.size[0], terrarian.size[1]);
        ctx.fill();
	}
}

function mainLoop(){
	me.play = false;
	for(var player of players){
		if(player.name == me.name){me.play = true; break;}
	}
	if(me.play){
		ticker(canThrow, 200);
		resetShoot();
		var forSend = {name: me.name, pos: me.pos, vel: me.vel, angle: me.angle};
		socket.send(JSON.stringify(forSend));
		controlUnit();
		processGame();
		renderGame();
		window.scrollTo(me.pos[0]-w/2,me.pos[1]-w/4);
		me.push = false;
	}
	else{
		socket.send(JSON.stringify({type: 'spectator'}));
		renderGame();
	}
}

initialize();
setInterval(function(){mainLoop();}, 16);