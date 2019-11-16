createImportWindow = function(pid)
{
	var view = WIBS.uploadView;
	if(!view)
	{
		//$B%U%!%$%k%"%C%W%U%l!<%`$N:n@.(J
		view = AFL.createFrameWindow('form');
		WIBS.uploadView = view;
		view.onClose = function()
		{
			WIBS.uploadView = null;
		}
		view.method="post";
		view.encoding="multipart/form-data";
		view.enctype="multipart/form-data";
		view.target = "UPFRAME";
		view.setTitle('$B%$%s%]!<%H(J');
		
		var panel = AFL.createPanel();
		panel.setChildStyle('BOTTOM');
		view.addChild(panel);
		var sendButton = AFL.createButton('submit');
		sendButton.setChildStyle('LEFT');
		sendButton.setText('$BAw?.(J',true);
		panel.addChild(sendButton);
		var list = AFL.createList();
		list.setChildStyle('CLIENT');
		view.addChild(list);
		list.addField('FILE',250);
		for(var i=0;i<1;i++)
		{
			var item = list.addItem('');
			list.setItemType(item,0,'FILE');
			list.setItemEdit(item,0,true);
		}
		WIBS.callbackUpload = function()
		{
			view.close();
		}
	}
	view.action = AFL.sprintf("?cmd=import&pid=%d",pid);
	view.setSize(300,100);
	view.setPos();
	view.show();
}



//$BJ8;zNs$NCV49(J
//src $B85J8;zNs(J
//datas data[$BCV4985(J] = $BCV498e(J
function replaceText(src,datas)
{
	var dest = new String();
	var i;
	var length = src.length;
	var flag;
	var len = 0;
	for(i=0;i<length;i++)
	{
		flag = true;
		for(index in datas)
		{
			var data = datas[index];
			if(src.substr(i,index.length).indexOf(index) == 0)
			{
				if(len)
				{
					dest += src.substr(i-len,len);
					len = 0;
				}
				dest += data;
				flag = false;
				i += index.length - 1;
				break;
			}
		}
		if(flag)
			len++;
//			dest += src.charAt(i);
	}
	dest += src.substr(i-len,len);
	return dest;
}
//HTML$B$NFC<lJ8;z$r(JTEXT$B$KJQ49(J
function HTMLtoTEXT(src)
{
	var data = new Array();
	data['&nbsp;'] = ' ';
	data['&amp;'] = '&';
	data['&lt;'] = '<';
	data['&gt;'] = '>';
	return replaceText(src,data);
}
WIBS.jumpMessage = function(msgID)
{
	var treeView = WIBS.treeView;
	var item = treeView.findItem(msgID);
	if(item)
		item.selectItem(msgID);
}
WIBS.loadTree = function(msgID)
{
	if(msgID)
		WIBS.messageID = msgID;
	function onLoad(datas)
	{
		if(datas == null)
		{
			WIBS.messageTree.setHTML('Error');
			return;
		}
		if(WIBS.messageTree)
		{
			WIBS.messageTree.close();
			WIBS.messageTree = null;
		}
		var treeView = WIBS.treeView;
		treeView.clearItem();
		if(!datas)
			return;
		if(!datas.length)
			return;
		
		var topix = new Array();
		var data;
		for(var i=0;data = datas[i];i++)
		{
			var mid = data['message_id'];
			var pid = data['parent_id'];
			var title = data['title'];
			var type = data['type'];
			var enable = data['enable'];
			
			var titleName;
			if(data['title_type'] == 3 || data['title']=='')
				titleName = '_____';
			else
				titleName = data['title'];
			var item;
			if(i == 0)
				item = treeView.addItem(titleName,true);
			else
				item = topix[pid].addItem(titleName,type==1);
			item.setItemValue(mid);
			if(enable == 0)
				item.setBackColor('#FFAAAA');
			if(type == 1)
				item.setTextColor('#228822');
			topix[mid] = item;
			item.ondblclick=function(e)
			{
				if(WIBS.isUser())
					WIBS.createEditFrame();
				AFL.cancel(e);
			}
		}
		WIBS.openTree(WIBS.messageID);
		treeView.__reload = true;
		treeView.selectItem(WIBS.messageID);
		treeView.__reload = false;
	}
	if(!WIBS.messageTree)
	{
		WIBS.messageTree = createMessageWindow("$B%a%C%;!<%8(J",'Loading tree');
	}
	AFL.recvHttpTable(getURL()+"?cmd=topic_list",onLoad);
}
WIBS.openTree = function(mid)
{
	var treeView = WIBS.treeView;
	var item = treeView.findItem(mid);
	if(item)
		item.setOpen(true);
}
function createMessageWindow(title,text)
{
	var msg = AFL.createFrameWindow();
	msg.setBackgroundColor('white');
	msg.setAlpha(80);
	msg.setTitle(title);
	msg.setSize(320,140);
	msg.setHTML(text);
	msg.setPos();
	msg.show();
	return msg;
}

WIBS.loadMessage = function(mid,reload)
{
	if(mid == null)
		mid = WIBS.messageID;
	function outTableMessage(data)
	{
		var msg = '<TABLE border>';
		var re = data.split('\n');
		for(var j=0;re[j];j++)
		{
			if(re[j].length == 0)
				continue;
			msg += '<TR>';
			var da = re[j].split(',');
			for(var i=0;da[i];i++)
			{
				if(j==0)
					msg += '<TH>' + da[i] + '</TH>';
				else
					msg += '<TD>' + da[i] + '</TD>';
			}
			msg += '</TR>';
		}
		msg += '</TABLE>';
		return msg;
	}
	function createMessage(data)
	{
		var message = document.createElement('DIV');
		var pid = parseInt(data['parent_id']);
		var id = parseInt(data['message_id']);
		var titleType = '';
		var title = data['title'];
		if(id == mid)
			document.title = HTMLtoTEXT(title);
		
		message.style.margin = '8px';
		message.style.marginBottom = '16px';
		message.style.marginRight = 0;
		message.style.borderLeftStyle = 'dashed';
		message.style.borderColor = '#F4F4F4';
		message.style.borderWidth = '1px';
		
		var messageType = parseInt(data['message_type']);
		var rep = {"\t":"&nbsp;&nbsp;&nbsp;&nbsp;"," ":"&nbsp;","&":"&amp;","<":"&lt;",">":"&gt;","\r\n":"<BR>","\n":"<BR>"};
		var titleNode = document.createElement('A');
		titleNode.onclick = function()
		{
			WIBS.treeView.selectItem(id);
			if(WIBS.isUser())
				WIBS.createEditFrame(id);
		}
		titleNode.style.cursor = 'pointer';
		titleNode.style.textDecoration = 'none';
		titleNode.style.fontWeight = 'bold';
		
		message.setName = function(name)
		{
			titleNode.name = name;
			titleNode.id = name;
		}
		switch(parseInt(data['title_type']))
		{
		case 0:
			titleNode.style.textAlign = 'center';
			titleNode.style.display = 'block';
			titleNode.style.fontSize = "32px";
			titleNode.style.color = '#FF3333';
			titleNode.style.backgroundColor = '#94EC8C';
			break;
		case 1:
			titleNode.style.display = 'block';
			titleNode.style.color = 'blue';
			titleNode.style.backgroundColor = '#E0E0E0';
			titleNode.style.fontSize = "24px";
			break;
		case 2:
			titleNode.style.fontSize = "16px";
			titleNode.style.color = 'blue';
			titleNode.style.backgroundColor = '#E0E0E0';
			break;
		case 3:
			title = '';
			break;
		}
		titleNode.innerHTML = title;
		message.appendChild(titleNode);
		
		if(data['message'] != '')
		{
			var msgNode = document.createElement('DIV');
			msgNode.style.padding = '8px';
			msgNode.style.marginTop = '2px';
			msgNode.style.marginLeft = '4px';
			msgNode.style.marginRight = '4px';
			switch(messageType)
			{
			case 0:
				msgNode.innerHTML = data['message'];
				break;
			case 1:
				msgNode.innerHTML = replaceText(data['message'],rep);
				break;
			case 2:
				msgNode.innerHTML = outTableMessage(data['message']);
				break;
			}
			message.appendChild(msgNode);
		}
		//$B%3%a%s%HNN0h$N:n@.(J
		var commentCount = parseInt(data['count']);
		var comment = document.createElement('div');
		message.appendChild(comment);
		comment.style.textAlign = 'right';
		comment.style.marginBottom = '-8px';
		comment.style.zIndex = 5;
		comment.style.position = 'relative';
		var commentText = document.createElement('span');
		commentText.style.cursor = 'pointer';
		commentText.style.fontSize = '12px';
		commentText.style.fontWeight = 'bold';
		commentText.style.backgroundColor = '#F0F0F0';
		commentText.style.color = '#555555';
		commentText.innerHTML = AFL.sprintf('comment(%d)',commentCount);
		comment.appendChild(commentText);
		comment.onclick = function()
		{
			if(commentMessage.style.display == 'block')
				commentMessage.style.display = 'none';
			else
				commentMessage.style.display = 'block';
		}
		function onCommentLoad(datas)
		{
			if(datas)
			{
				commentText.innerHTML = AFL.sprintf('comment(%d)',datas.length);
			}
			commentMessage.removeChild(commentWrite);
			commentMessage.innerHTML = '';
			for(var index in datas)
			{
				var data = datas[index];
				var msg = document.createElement('div');
				msg.style.backgroundColor = '#EEEEEE';
				msg.style.padding = '8px';
				var name = document.createElement('SPAN');
				name.innerHTML = replaceText(data['comment_name'],rep);
				name.style.fontWeight = 'bold';
				msg.appendChild(name);
				var date = document.createElement('SPAN');
				date.style.marginLeft = '16px';
				date.innerHTML = data['comment_date'];
				date.style.fontStyle = 'italic';
				msg.appendChild(date);
				if(WIBS.isUser())
				{
					var del = document.createElement('SPAN');
					del.style.padding = '1px';
					del.style.backgroundColor = '#4444FF';
					del.style.color = '#AAFFAA';
					del.style.cursor = 'pointer';
					del.style.marginLeft = '32px';
					del.innerHTML = 'DEL';
					del.__id = data['comment_id'];
					del.onclick = function()
					{
						var cid = this.__id;
						AFL.recvHttpData(getURL()+"?cmd=delete_comment",null,null,{'comment_id':cid});
						message.loadComment(id);
					}
					msg.appendChild(del);
				}
				var text = document.createElement('DIV');
				text.style.marginLeft = '16px';
				text.innerHTML = replaceText(data['comment_message'],rep);
				msg.appendChild(text);
				commentMessage.appendChild(msg);
			}
			commentMessage.appendChild(commentWrite);
		}
		message.loadComment = function(id)
		{
			AFL.recvHttpTable(getURL()+"?cmd=comment",onCommentLoad,{'mid':id});
		}
		var commentMessage = document.createElement('div');
		commentMessage.style.fontSize = '12px';
		commentMessage.style.fontColor = '#555555';
		commentMessage.style.marginLeft = '64px';
		commentMessage.style.display = 'none';
		message.appendChild(commentMessage);

		var commentWrite = document.createElement('div');
		commentWrite.style.textAlign = 'right';
		commentWrite.style.marginTop = '18px';
		var commentWriteText = document.createElement('span');
		commentWrite.appendChild(commentWriteText);
		commentWriteText.style.cursor = 'pointer';
		commentWriteText.style.fontSize = '12px';
		commentWriteText.style.fontWeight = 'bold';
		commentWriteText.style.backgroundColor = '#F0A0A0';
		commentWriteText.style.color = '#555555';
		commentWriteText.innerHTML = "WRITE";
		commentMessage.appendChild(commentWrite);
		commentWriteText.onclick = function()
		{
			WIBS.createCommentWindow(id);
		}

		var msgView = WIBS.msgView;
		msgView.messageList[id] = message;
		if(msgView.messageList[pid])
			msgView.messageList[pid].appendChild(message);

		if(commentCount > 0)
		{
			message.loadComment(id);
		}

		return message;
	}
	function onLoad(datas)
	{
		var msgView = WIBS.msgView;
		msgView.messageList = new Array();
		if(datas == null || datas.length == 0)
		{
			WIBS.messageMsg.setHTML('Not found');
			return;
		}
		if(WIBS.messageMsg)
		{
			WIBS.messageMsg.close();
			WIBS.messageMsg = null;
		}
		msgView.innerHTML = "";
		var msg = document.createElement('DIV');
		msg.style.margin = '8px';
		for(var i=0;data = datas[i];i++)
		{
			if(i==0)
				msg.appendChild(createMessage(data));
			else
				createMessage(data);
		}
		msgView.appendChild(msg);
		var m = WIBS.msgView.messageList[mid];
		if(m)
		{
			m.setName(mid);
			location.hash = mid;
			m.setName('');
		}
	}
	if(WIBS.msgView.messageList[mid]!=null && !reload)
	{
		var m = WIBS.msgView.messageList[mid];
		if(m)
		{
			m.setName(mid);
			location.hash = mid;
			m.setName('');
		}
	}
	else
	{
		if(!WIBS.messageMsg)
		{
			WIBS.messageMsg = createMessageWindow("$B%a%C%;!<%8(J",'Loading message');
			WIBS.messageMsg.movePos(30,30);
		}
		AFL.recvHttpTable(getURL()+"?cmd=message",onLoad,{'mid':mid,'t':1});
	}
	WIBS.messageID = mid;
}
WIBS.setPriorityUP = function()
{
	var tree = WIBS.treeView;
	var item = tree.getSelectItem();
	if(item)
	{
		var r = AFL.recvHttpData(getURL()+"?cmd=move_topic&up",null,{'id':item.getItemValue()});
		if(r==1)
		{
			var index = item.getChildIndex();
			item.setChildIndex(index-1);
			WIBS.loadMessage(null,true);
		}
	}
}
WIBS.setPriorityDOWN = function()
{
	var tree = WIBS.treeView;
	var item = tree.getSelectItem();
	if(item)
	{
		var r = AFL.recvHttpData(getURL()+"?cmd=move_topic&down",null,{'id':item.getItemValue()});
		if(r==1)
		{
			var index = item.getChildIndex();
			item.setChildIndex(index+1);
			WIBS.loadMessage(null,true);
		}
	}
}
WIBS.isUser = function()
{
	return WIBS.userName != 'guest';
}
WIBS.panelSet = function()
{
	var buttons = WIBS.adminButton;
	var visible = WIBS.userName != 'guest';
	for(var i=0;buttons[i];i++)
	{
		buttons[i].setVisible(visible);
	}
	AFL.layoutWindow();
}
WIBS.init = function()
{
	//$B=i4|2=(J
	AFL.init();

	AFL.setCookie('mode','EDIT');


	//$BGX7J?'$rGr$K(J
	document.body.style.width = '100%';
	document.body.style.height = '100%';
	document.body.style.margin = '0';
	document.body.style.backgroundColor = '#ffffff';
	document.body.style.fontFamily = "monospace";
	document.body.style.overflow = 'hidden'
	document.documentElement.style.overflow = 'hidden'
	document.documentElement.style.width = '100%';
	document.documentElement.style.height = '100%';
	document.documentElement.style.margin = '0';
	
	//$B4pK\%&%$%s%I%&%l%$%"%&%H$N:n@.(J
	var mainWindow = AFL.createWindow();
	mainWindow.setChildStyle('CLIENT');
	
	//$B%Q%M%k$N:n@.(J
	var panel = AFL.createPanel();
	panel.setChildStyle('BOTTOM');
	
	WIBS.onLogin = function()
	{
		statUser.setText(WIBS.userNick,true);
		WIBS.panelSet();
		WIBS.loadTree();
	}
	//$B%Q%M%k@_Dj(J
	var statUser = AFL.createButton();
	statUser.setChildStyle("LEFT");
	statUser.setWidth(92);
	statUser.onclick = WIBS.drawLoginWindow;
	statUser.style.cursor = 'pointer';
	panel.addChild(statUser);
	var statReload = AFL.createButton();
	statReload.setChildStyle("LEFT");
	statReload.setText('$B99?7(J',true);
	statReload.onclick = function()
	{
		WIBS.loadTree();
	}
	panel.addChild(statReload);
	var statSearch = AFL.createButton();
	statSearch.setChildStyle("LEFT");
	statSearch.setText('$B8!:w(J',true);
	panel.addChild(statSearch);
	statSearch.onclick = createSearchWindow;
	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('$B%3%a%s%H(J',true);
	panel.addChild(button);
	button.onclick = WIBS.createCommentList;
	
	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('PDF',true);
	panel.addChild(button);
	button.onclick = function()
	{
		window.open("?cmd=pdf&id="+WIBS.messageID,"_blank");
	}
	
	var statPopup = AFL.createButton();
	statPopup.setChildStyle("LEFT");
	statPopup.setText('POPUP',true);
	panel.addChild(statPopup);
	
	statPopup.onclick = function()
	{
		var width = AFL.getClientWidth();
		var height = AFL.getClientHeight();
		var w = AFL.createFrameWindow();
		w.setTitle('$B%]%C%W%"%C%W(J');
		w.setSize(width/2,height*3/5);
		w.setAlpha(95);
		w.setBackgroundColor('white');
		w.setPos();

		var msg = AFL.createWindow();
		msg.setSelectFlag(true);
		msg.setScroll(true);
		msg.setChildStyle('CLIENT');
		msg.messageList = new Array();
		w.addChild(msg);
		WIBS.msgView = msg;
		w.onActive = function(flag)
		{
			if(flag)
				WIBS.msgView = msg;
		}
		w.show();
	}
	
	WIBS.adminButton = new Array();
	
	var statFile = AFL.createButton();
	statFile.setChildStyle("LEFT");
	statFile.setText('FILE',true);
	statFile.onclick = WIBS.createFileView;
	panel.addChild(statFile);
	var statUserList = AFL.createButton();
	statUserList.setChildStyle("LEFT");
	statUserList.setText('$B%f!<%6(J',true);
	statUserList.onclick = WIBS.drawUserView;
	panel.addChild(statUserList);
	
	WIBS.adminButton.push(statFile);
	WIBS.adminButton.push(statUserList);

	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('$B%m%0(J',true);
	button.onclick = WIBS.createLogWindow;
	panel.addChild(button);
	WIBS.adminButton.push(button);


	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('$BJT=8(J',true);
	button.onclick = function(){WIBS.createEditFrame();};
	panel.addChild(button);
	WIBS.adminButton.push(button);

	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('$B?75,(J($B30It(J)',true);
	button.onclick = function()
	{
		var item = tree.getSelectItem();
		if(item)
		{
			var mid = item.getItemValue();
			var url;
			url = AFL.sprintf("?cmd=create_message&message_id=%d&option=%d",mid,0);
			id = AFL.recvHttpData(getURL()+url);
			if(id > 0)
			{
				WIBS.createEditFrame(id);
				WIBS.loadTree(id);
			}
		}
	}
	panel.addChild(button);
	WIBS.adminButton.push(button);
	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('$B?75,(J($BFbIt(J)',true);
	button.onclick = function()
	{
		var item = tree.getSelectItem();
		if(item)
		{
			var mid = item.getItemValue();
			var url;
			url = AFL.sprintf("?cmd=create_message&message_id=%d&option=%d",mid,2);
			id = AFL.recvHttpData(getURL()+url);
			if(id > 0)
			{
				WIBS.createEditFrame(id);
				WIBS.loadTree(id);
			}
		}
	}
	panel.addChild(button);
	WIBS.adminButton.push(button);
	
	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('$B",(J',true);
	button.onclick = WIBS.setPriorityUP;
	panel.addChild(button);
	WIBS.adminButton.push(button);

	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('$B"-(J',true);
	button.onclick = WIBS.setPriorityDOWN;
	panel.addChild(button);
	WIBS.adminButton.push(button);

	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('EXPORT',true);
	button.onclick = function()
	{
		var item = tree.getSelectItem();
		var mid = 1;
		if(item)
			mid = item.getItemValue();
		window.open("?cmd=xml&id="+mid,null);
		return false;
	}
	panel.addChild(button);
	WIBS.adminButton.push(button);

	var button = AFL.createButton();
	button.setChildStyle("LEFT");
	button.setText('IMPORT',true);
	button.onclick = function()
	{
		var item = tree.getSelectItem();
		var mid = 1;
		if(item)
			mid = item.getItemValue();
		createImportWindow(mid);
		return false;
	}
	panel.addChild(button);
	WIBS.adminButton.push(button);


	//$BJ,3d%P!<$N:n@.(J
	var split = AFL.createSplitWindow();
	mainWindow.addChild(split);
	//$B%D%j!<%S%e!<$N:n@.(J
	var tree = AFL.createTree();
	tree.setChildStyle('CLIENT');
	split.addChild(0,tree);
	WIBS.treeView = tree;
	tree.onItemSelect = function(item)
	{
		document.title = item.getItemText();
		WIBS.loadMessage(item.getItemValue(),this.__reload);
	}
	tree.onItemMove = function(item1)
	{
		var item2 = this.getHoverItem();
		if(item2)
		{
			if(WIBS.isUser() && item1!=item2)
			{
				var oldParent = item1.getParentItem();
				if(oldParent != item2)
				{
					var newPID = item2.getItemValue();
					var url = AFL.sprintf("?cmd=move_topic&id=%d&pid=%d",item1.getItemValue(),newPID);
					if(AFL.recvHttpData(getURL()+url) == 1)
						WIBS.loadTree(item1.getItemValue());
				}
			}
		}
		//alert(item);
	}

	//$B%a%C%;!<%8%S%e!<$N:n@.(J
	var msg = AFL.createWindow();
	msg.messageList = new Array();
	msg.setSelectFlag(true);
	msg.setScroll(true);
	msg.setChildStyle('CLIENT');
	split.addChild(1,msg);
	WIBS.msgView = msg;
	msg.onActive = function(flag)
	{
		if(flag)
			WIBS.msgView = this;
	}

	WIBS.login();
	mainWindow.show();
	mainWindow.addChild(panel);
}

getUrlParam = function()
{
	String(location.hash).match(/#(\d+)/i);
	if(RegExp.$1)
		return RegExp.$1;
	else
		return null;
}
function createSearchWindow()
{
	var frame = AFL.createFrameWindow();
	frame.setAlpha(90);
	frame.setTitle("$B8!:w(J");
	frame.setSize(320,400);
	frame.setPos();
	
	
	var head = AFL.createPanel();
	frame.addChild(head);
	head.setChildStyle("TOP");
	head.setSize(1,24);


	
	var button = AFL.createButton();
	button.setChildStyle("RIGHT");
	button.setSize(64,0);
	button.setText("$B8!:w(J");
	head.addChild(button);
	
	
	var list = AFL.createList();
	list.setChildStyle("CLIENT");
	list.addField("ID",64);
	list.addField("$B%?%$%H%k(J");
	list.onItemClick = function(index)
	{
		var id = parseInt(list.getItemText(index,0));
		WIBS.loadMessage(id);
		WIBS.openTree(id);
		WIBS.treeView.selectItem(id);
	}
	frame.addChild(list);
	var input = AFL.createTextBox();
	input.setChildStyle('CLIENT');
	head.addChild(input);
	
	function onSearch(datas)
	{
		list.clearItem();
		for(var index=0;datas[index];index++)
		{
			var data = datas[index];
			list.addItem(data['message_id']);
			list.setItemText(index,1,data['title']);
		}
	}
	input.onkeypress = function()
	{
		if(AFL.KEYMAP[13])
		{
			button.onclick();
		}
		return true;
	}
	
	button.onclick = function()
	{
		AFL.recvHttpTable(getURL()+"?cmd=search&keyword="+encodeURIComponent(input.getText()),onSearch);
	}
	
	frame.show();
	list.setFieldLast();
	input.focus();
	return frame;
}

WIBS.createCommentWindow = function(id)
{
	var frame = AFL.createFrameWindow();
	frame.setAlpha(95);
	frame.setSize(400,300);
	frame.setTitle('$B%3%a%s%H(J');
	var panel = AFL.createPanel();
	panel.setChildStyle('TOP');
	frame.addChild(panel);
	var button = AFL.createButton();
	button.setChildStyle('RIGHT');
	button.setText('$B=q$-9~$_(J',true);
	panel.addChild(button);
	button.onclick = function()
	{
		var postData = new Array();
		postData['message_id'] = id;
		postData['name'] = name.getText();
		postData['message'] = box.getText();
		var ret = AFL.recvHttpData(getURL()+"?cmd=write_comment",null,null,postData);
		if(ret == 1)
		{
			frame.close();
			var msgView = WIBS.msgView;
			var message = msgView.messageList[id];
			if(message)
				message.loadComment(id);
		}
		else
			msgLabel.innerHTML = ret;
	}
	//$BL>A0%i%Y%k$N@8@.(J
	var label = AFL.createWindow();
	label.innerHTML = '$BL>A0(J';
	label.setChildStyle('LEFT');
	label.setWidth(48);
	panel.addChild(label);
	//$BL>A0F~NOMQ(J
	var name = AFL.createTextBox();
	name.setChildStyle('CLIENT');
	panel.addChild(name);
	//$B%a%C%;!<%8I=<(MQ%Q%M%k(J
	var panel = AFL.createPanel();
	panel.setChildStyle('BOTTOM');
	frame.addChild(panel);
	var msgLabel = AFL.createWindow();
	msgLabel.setChildStyle('CLIENT');
	msgLabel.innerHTML = '$B%3%a%s%H$NJ]B84|4V$O(J2$B=54V$G$9(J';
	panel.addChild(msgLabel);
	//$B%a%C%;!<%8F~NOMQ(J
	var box = AFL.createEditBox();
	box.setChildStyle('CLIENT');
	frame.addChild(box);
	frame.setPos();
	frame.show();
}
WIBS.createEditFrame = function(mid)
{
	var win = window.open('?cmd=edit','','width=600,height=480,menubar=no, toolbar=no,location=no');
	ChildOnLoad = function()
	{
		win.win.load(mid);
	}
	return win;
}

WIBS.createLogWindow = function()
{
	var frame = AFL.createFrameWindow();
	var list = AFL.createList();
	list.setChildStyle('CLIENT');
	frame.addChild(list);
	list.addField("ID",32);
	list.addField("DATE",128);
	list.addField("IP",80);
	list.addField("COMMAND",100);
	list.addField("PARAM",48);
	list.addField("CODE",32);
	list.addField("AGENT",64);
	list.addField("REFERER",512);
	
	frame.setSize(640,480);
	frame.setPos();


	var datas = AFL.recvHttpTable(getURL() + '?cmd=log_list',onLoad);
	function onLoad(datas)
	{
		if(!datas)
			return false;
		for(var i=0;datas[i];i++)
		{
			var data = datas[i];
			var item = list.addItem(data['id']);
			list.setItemText(item,1,data['dtime']);
			list.setItemText(item,2,data['ip1']);
			list.setItemText(item,3,data['command']);
			list.setItemText(item,4,data['param']);
			list.setItemText(item,5,data['ucode']);
			list.setItemText(item,6,data['agent']);
			list.setItemText(item,7,data['referer']);
		}
		frame.show();
	}


	return frame;
}
WIBS.createCommentList = function()
{
	var frame = AFL.createFrameWindow();
	frame.setTitle('$B%3%a%s%HMzNr(J');
	var list = AFL.createList();
	list.setChildStyle('CLIENT');
	frame.addChild(list);
	list.addField("TITLE",128);
	list.addField("DATE",128);
	list.addField("MESSAGE",300);
	frame.setSize(480,300);
	frame.setPos();
	frame.show();
	
	list.onItemClick = function(row,col)
	{
		var id = this.getItemValue(row);
		WIBS.jumpMessage(id);
	}
	function onLoad(datas)
	{
		list.clearItem();
		for(var index in datas)
		{
			var data = datas[index];
			var item = list.addItem(data['title']);
			list.setItemText(item,1,data['comment_date']);
			list.setItemText(item,2,data['comment_message']);
			list.setItemValue(item,data['message_id']);
		}
	}
	AFL.recvHttpTable(getURL() + '?cmd=comment_list',onLoad);
	
	return frame;
}
//$B%a%C%;!<%8(JID$B$r(JURL$B$+$i<h$j=P$9(J
WIBS.messageID = getUrlParam();
if(WIBS.messageID == null)
	WIBS.messageID = 1;


function Main(){
	WIBS.init();
	AFL.layoutWindow();
}
//$B%Z!<%8FI$_9~$_;~$K<B9T$9$k=hM}$r@_Dj(J
addEventListener("DOMContentLoaded", Main)