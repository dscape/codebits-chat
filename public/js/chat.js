function initPen(){
  var myInfo = null;
  var members = [];
  var input = {};
  var pen = $('#pen');
  var pusher = new Pusher('a553813b71932b8355e4');
  var penChan = pusher.subscribe('presence-pen');
  var last_top;
  var last_key = {};
  var speed = 2;

  penChan.bind('pusher:damien_send_subscribe', function(channel_data) {
    console.log(channel_data);
    myInfo = JSON.parse(channel_data);
  });

  penChan.bind('pusher:subscription_succeeded', function(members) {
    // update_member_count(members.count);
    members.each(function(member) {
      addMember(member.id, member.info);
    });

    myInfo.elm = $('#player-'+myInfo.id);
    setInterval(render, 130);
  });

  penChan.bind('pusher:member_added', function(member) {
    addMember(member.id, member.info);
  });

  penChan.bind('pusher:member_removed', function(member) {
    removeMember(member.id);
  });

  // Pusher.log = function(message) {
  //   if (window.console && window.console.log) window.console.log(message);
  // };

  function addMember(id, info) {
    members[id] = info;
    pen.append('<div class="player" style="left:'+id*4+'px" id="player-'+id+'"><div class="chatbox"><div class="chat" style="" id="chat-'+id+'"></div><div class="chatarrow"></div></div><div class="sprite '+info.animal+'" style="background: url(/img/sapo.png) top left no-repeat;"></div></div>');
    members[id].elm = $('#player-'+id);
    members[id].chatElm = members[id].elm.find('.chat');
    members[id].chatBoxElm = members[id].elm.find('.chatbox');
  }

  function removeMember (id, info) {
    $('#player-'+id).remove();
  }

  // Chat typing

  function rcvdKey(data) {
    // console.log("MID:"+data.user_id);
    // console.log("RCVD:"+data.key);
    member = members[data.user_id];

    member.chatBoxElm.show();
    if (member.chatTimeout) clearTimeout(member.chatTimeout);
    member.chatTimeout = setTimeout(function() {
      member.chatBoxElm.fadeOut();
      member.chatBoxElm.children(".chat").html("");
    }, 2000);
  
    if (data.key == 'BACKSPACE') {
      member.chatElm.find('span').last().remove();
    } else {
    console.log(data.key);
      if (data.key == ' ') {data.key = "&nbsp;";}
      if (data.key == 'ENTER') {
        member.chatElm.append('<br/><br/></br>');
      } else {
        member.chatElm.append('<span>'+data.key+'</span>');
      }
      member.chatElm.scrollTop(3000);
    }
  }

  function sendKey (key) {
    var data = {user_id: myInfo.user_id, key:key};
    penChan.trigger('client-key', data);
    rcvdKey(data);
  }

  penChan.bind('client-key', function(data) {
    rcvdKey(data);
  });

  penChan.bind('client-pos', function(data) {
    $('#player-'+data.user_id).css({
      left: data.left,
      top: data.top
    });
  });

  $('body').keypress(function (evt) { 
    // this.value = this.value.replace(/[^0-9\.]/g,'');
    sendKey(String.fromCharCode(evt.which));
    console.log(String.fromCharCode(evt.which));
  });
  $('body').keydown(function (evt) {
    if (evt.keyCode == 8) {
      sendKey('BACKSPACE');
      return false;
    }
    if (evt.keyCode == 13) {
      sendKey('ENTER');
      return false;
    }
  });

  // Character moving

  var directions = {
    37: 'left',
    39: 'right',
    38: 'up',
    40: 'down'
  };

  $('body').live('keydown', function(evt) {
    if (directions[evt.keyCode]) {
      if (directions[evt.keyCode] == 'left')
        input.left = true;
      if (directions[evt.keyCode] == 'right')
        input.right = true;
      if (directions[evt.keyCode] == 'up')
        input.up = true;
      if (directions[evt.keyCode] == 'down')
        input.down = true;
      evt.preventDefault();
      return false;
    }
  });
  
  $('body').live('keyup', function(evt) {
    if (directions[evt.keyCode]) {
      if (directions[evt.keyCode] == 'left')
        input.left = false;
      if (directions[evt.keyCode] == 'right')
        input.right = false;
      if (directions[evt.keyCode] == 'up')
        input.up = false;
      if (directions[evt.keyCode] == 'down')
        input.down = false;
      evt.preventDefault();
      return false;
    }
  });

	var myCreds = localStorage.creds || 40;
	$('.creds').text(myCreds);
	
  function render() {
    myInfo.elm = $('#player-'+myInfo.user_id);
    var pos = myInfo.elm.position();
    var moved = false;
    if (input.left) {
      if(last_key.left) { speed = Math.floor(2*Math.log(last_key.left)); }
      else { speed = 2; }
      pos.left = pos.left - speed;
      last_key = {left: (last_key.left||0)+1};
      moved = true;
    }if (input.right){
      if(last_key.right) { speed = Math.floor(2*Math.log(last_key.right)); }
      else { speed = 2; }
      pos.left = pos.left + speed;
      last_key = {right: (last_key.right||0)+1};
      moved = true;
    }if (input.up){
      if(last_key.up) { speed = Math.floor(2*Math.log(last_key.up)); }
      else { speed = 2; }
      pos.top = pos.top - speed;
      last_key = {up: (last_key.up||0)+1};
      moved = true;
    }if (input.down){
      if(last_key.down) { speed = Math.floor(2*Math.log(last_key.down)); }
      else { speed = 2; }
      pos.top = pos.top + speed;
      last_key = {down: (last_key.down||0)+1};
      moved = true;
    }
    if (moved === true) {
      if(pos.top-last_top===48) {
        pos.top = last_top;
      } else if ((pos.top-last_top===(48+speed)) || (pos.top-last_top===(48-speed))) {
        pos.top = pos.top-48;
      }
      last_top = pos.top;
      penChan.trigger('client-pos', {
        user_id: myInfo.user_id,
        left: pos.left,
        top: pos.top
      });
      input = {};
      myInfo.elm.css({
        left: pos.left,
        top: pos.top
      });
    }
  }
}

$(document).ready(initPen);