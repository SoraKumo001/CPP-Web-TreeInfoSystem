//システム用名前空間の定義
WIBS = {}

WIBS.drawUserView = function()
{
	var userView = WIBS.userView;
	if(!userView)
	{
		userView = AFL.createFrameWindow();
		userView.setTitle('ユーザ情報');
		WIBS.userView = userView;
		userView.onClose = function()
		{
			WIBS.userView = null;
		}
		var panel = AFL.createPanel();
		panel.setChildStyle('TOP');
		userView.addChild(panel);
		
		var addUser = AFL.createButton();
		addUser.setChildStyle('LEFT');
		addUser.setText('設定保存',true);
		panel.addChild(addUser);
		var delUser = AFL.createButton();
		delUser.setChildStyle('LEFT');
		delUser.setText('ユーザ削除',true);
		panel.addChild(delUser);
		
		var list = AFL.createList();
		list.setChildStyle('CLIENT');
		userView.addChild(list);
		list.addField('ID',32);
		list.addField('ENABLE',64);
		list.addField('NAME',128);
		list.addField('PASSWORD',128);
		list.addField('NICKNAME',128);
		
		function addInputLine(id)
		{
			var item = list.addItem(id);
			list.setItemType(item,1,'checkbox');
			list.setItemType(item,3,'password');
			list.setItemEdit(item,2,true);
			list.setItemEdit(item,3,true);
			list.setItemEdit(item,4,true);
			list.setItemCheck(item,1,true);
			return item;
		}
		onLoad = function(datas)
		{
			list.clearItem();
			if(datas)
			{
				for(var i=0;datas[i];i++)
				{
					var data = datas[i];
					var item = addInputLine(data['user_id']);
					list.setItemCheck(item,1,data['user_enable'] == 1);
					list.setItemText(item,2,data['user_name']);
					list.setItemText(item,3,'--------');
					list.setItemText(item,4,data['user_nick']);
				}
				for(var i=0;i<10;i++)
					addInputLine(0);
			}
			else
				userView.close();
			list.setFieldLast();
		}
		addUser.onclick = function()
		{
			var count = list.getItemCount();
			var outdata = new Array();
			for(var i=0;i<count;i++)
			{
				var id = list.getItemText(i,0);
				var enable = list.getItemCheck(i,1);
				var name = list.getItemText(i,2);
				var pass = list.getItemText(i,3);
				var nick = list.getItemText(i,4);
				if(name != '')
				{
					var data = new Array();
					data['user_id'] = id;
					data['user_enable'] = enable;
					data['user_name'] = name;
					data['user_pass'] = pass;
					data['user_nick'] = nick;
					outdata.push(data);
				}
			}
			var text = AFL.createPostText(outdata);
			AFL.recvHttpTable(getURL()+"?cmd=user_write",null,null,{'data':text});
			AFL.recvHttpTable(getURL()+"?cmd=user_list",onLoad);
		}
		userView.setSize(640,200);
	}
	userView.setPos();
	userView.show();
	AFL.recvHttpTable(getURL()+"?cmd=user_list",onLoad);
}
WIBS.drawLoginWindow = function()
{
	var loginWindow = WIBS.loginWindow;
	if(!loginWindow)
	{
		loginWindow = AFL.createFrameWindow();
		loginWindow.setSize(320,140);
		WIBS.loginWindow = loginWindow;
		loginWindow.onClose = function()
		{
			WIBS.loginWindow = null;
		}
		loginWindow.setTitle('LOGIN');
		
		var panel = AFL.createPanel();
		panel.setChildStyle('TOP');
		loginWindow.addChild(panel);
		var loginButton = AFL.createButton();
		loginButton.setChildStyle('LEFT');
		loginButton.setText('ログイン',true);
		panel.addChild(loginButton);
		var logoutButton = AFL.createButton();
		logoutButton.setChildStyle('LEFT');
		logoutButton.setText('ログアウト',true);
		panel.addChild(logoutButton);
		var list = AFL.createList();
		list.setChildStyle('CLIENT');
		loginWindow.addChild(list);
		list.addField('項目',128);
		list.addField('データ',128);
		list.addItem('ID');
		list.addItem('PASSWORD');
		list.setItemEdit(0,1,true);
		list.setItemEdit(1,1,true);
		list.setItemType(0,1,'input');
		list.setItemType(1,1,'password');
		
		list.setItemValue(0,0);
		list.setItemValue(1,1);
		list.setItemText(0,1,WIBS.userName);
		list.setItemText(1,1,WIBS.userPass);
		
		loginButton.onclick = function()
		{
			var data = list.getItemValue(0);
			if(data == 0)
			{
				id = list.getItemText(0,1);
				pass = list.getItemText(1,1);
			}
			else
			{
				id = list.getItemText(1,1);
				pass = list.getItemText(0,1);
			}
			WIBS.login(id,pass);
		}
		logoutButton.onclick = function()
		{
			WIBS.login('guest','');
			list.setItemText(0,1,WIBS.userName);
			list.setItemText(1,1,WIBS.userPass);
		}
		list.setFieldLast();
	}
	loginWindow.setPos();
	loginWindow.show();
}
WIBS.onLogin = null;
WIBS.login = function(name,pass)
{
	if(name==null || pass==null)
	{
		name = AFL.getCookie(getURL()+'user_name');
		pass = AFL.getCookie(getURL()+'user_pass');
	}

	var url = AFL.sprintf("?cmd=user_login&id=%s&pass=%s",name,pass);
	var data = AFL.recvHttpTable(getURL()+url);
	if(data && data.length && data[0]['nick'])
	{
		name = data[0]['name'];
		if(!pass)
			pass = '';
		WIBS.userName = name;
		WIBS.userPass = pass;
		WIBS.userNick = data[0]['nick'];
		AFL.setCookie(getURL()+'user_id',data[0]['id']);
		AFL.setCookie(getURL()+'user_name',name);
		AFL.setCookie(getURL()+'user_pass',pass);
		AFL.setCookie(getURL()+'user_nick',WIBS.userNick);
		
		if(typeof(WIBS.onLogin) == 'function')
			WIBS.onLogin(true);
	}
	else
	{
		WIBS.userPass = '';
		WIBS.userName = '';
		WIBS.userNick = 'GUEST';
		if(typeof(WIBS.onLogin) == 'function')
			WIBS.onLogin(false);
	}
}
WIBS.createUploadView = function(pid)
{
	var view = WIBS.uploadView;
	if(!view)
	{
		//ファイルアップフレームの作成
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
		view.setTitle('アップロード');
		
		var panel = AFL.createPanel();
		panel.setChildStyle('BOTTOM');
		view.addChild(panel);
		var sendButton = AFL.createButton('submit');
		sendButton.setChildStyle('LEFT');
		sendButton.setText('送信',true);
		panel.addChild(sendButton);
		var list = AFL.createList();
		list.setChildStyle('CLIENT');
		view.addChild(list);
		list.addField('FILE');
		for(var i=0;i<10;i++)
		{
			var item = list.addItem('');
			list.setItemType(item,0,'FILE');
		}
		WIBS.callbackUpload = function()
		{
			WIBS.fileView.loadList(pid);
			view.close();
		}
	}
	view.action = AFL.sprintf("?cmd=file_upload&pid=%d",pid);
	view.setSize(300,200);
	view.setPos();
	view.show();
	list.setFieldLast();
}
WIBS.createFileView = function()
{
	var view = WIBS.fileView;
	if(WIBS.fileSelectID == null)
		WIBS.fileSelectID = 1;
	if(WIBS.dirSelectID == null)
		WIBS.dirSelectID = 1;

	if(view)
	{
		view.setPos();
		view.show();
		return view;
	}
	//ファイル管理フレームの作成
	view = AFL.createFrameWindow();
	WIBS.fileView = view;
	view.setTitle('File List');
	view.onClose = function()
	{
		WIBS.fileView = null;
	}
	
	//分割ウインドウ
	var split = AFL.createSplitWindow();
	view.addChild(split);
	view.setSize(640,400);
	
	//ツリー
	var tree = AFL.createTree();
	tree.setChildStyle('CLIENT');
	split.addChild(0,tree);

	tree.onItemSelect = function(item)
	{
		var id = item.getItemValue();
		WIBS.dirSelectID = id;
		view.loadList(id);
	}

	//リスト
	var list = AFL.createList();
	list.setChildStyle('CLIENT');
	list.addField('名前',128);
	list.addField('カウント');
	list.addField('サイズ');
	list.addField('日時',128);
	list.addField('TYPE',64);
	split.addChild(1,list);
	view.setSize(640,400);
	list.setFieldKind(1,1);
	list.setFieldKind(2,1);
	list.onItemClick = function(row,col)
	{
		var id = list.getItemValue(row);
		if(id > 0)
		{
			var url = AFL.sprintf("?cmd=file_download&id=%d",id);
			fileLink.innerHTML = AFL.sprintf("<A href='?cmd=file_download&id=%d'>%s</A>",id,list.getItemText(row,0));
		}
	}
	list.onItemMove = function(row,col)
	{
		var text = this.getItemText(row,0);
		var node = AFL.createWindow();
		var size = AFL.getFontSize(text,node);
		node.setSize(size.width,size.height);
		node.innerHTML = text;
		node.setPos(AFL.mouseX+3,AFL.mouseY+3);
		node.setMoveFlag(true);
		node.show();
		node.onMoved = function()
		{
			var item = tree.getHoverItem();
			if(item)
			{
				var pid = item.getItemValue();
				var count = list.getItemCount();
				for(var i=0;i<count;i++)
				{
					if(list.isSelectItem(i))
					{
						var id = list.getItemValue(i);
						var url = AFL.sprintf("?cmd=file_move&pid=%d&id=%d",pid,id);
						AFL.recvHttpTable(getURL()+url);
					}
				}
				view.loadList()
			}
			this.close();
		}
		AFL.setMoveNode(node);
	}
	list.onItemDblClick = function(row,col)
	{
		var id = list.getItemValue(row);
		if(id > 0)
		{
			if(view.onExec)
				view.onExec(id,list.getItemText(row,0));
			else
			{
				var url = AFL.sprintf("?cmd=file_download&id=%d",id);
				window.open(url,'_new','scrollbars=yes');
			}
		}
		else
		{
			tree.selectItem(-id);
		}
	}

	
	//パネル1
	var panel;
	panel = AFL.createPanel();
	panel.setChildStyle('BOTTOM');
	split.addChild(0,panel);
	
	var button;
	button = AFL.createButton();
	button.setChildStyle('LEFT');
	button.setText('新規');
	panel.addChild(button);
	button.onclick = function()
	{
		//新しいディレクトリ
		if(WIBS.dirSelectID > 0)
		{
			AFL.recvHttpTable(getURL(),null,{'cmd':'file_make_dir','pid':WIBS.dirSelectID,'file_name':'NewDir'});
			view.load();
		}
	}
	
	button = AFL.createButton();
	button.setChildStyle('LEFT');
	button.setText('変更');
	panel.addChild(button);
	button.onclick = function()
	{
		var item = tree.getSelectItem();
		if(item && item.getItemValue() > 1)
		{
			var input = AFL.createInputBox();
			var id = item.getItemValue();
			input.onEnter = function()
			{
				var name = input.getText();
				AFL.recvHttpTable(getURL()+"?cmd=file_rename",null,{'id':id,'file_name':name});
				view.load();
				input.close();
			}
			input.setTitle('ディレクトリ名');
			input.setText(item.getItemText());
			input.setPos();
			input.show();
			
		}
	}

	button = AFL.createButton();
	button.setChildStyle('LEFT');
	button.setText('削除');
	panel.addChild(button);
	button.onclick = function()
	{
		//ディレクトリの削除
		if(WIBS.dirSelectID <= 1)
			return;
		var item = tree.findItem(WIBS.dirSelectID);
		var id = 1;
		if(item)
			id = item.getParentItem().getItemValue();
		var url = AFL.sprintf("?cmd=file_remove&id=%d", WIBS.dirSelectID);
		AFL.recvHttpData(getURL() + url);
		WIBS.dirSelectID = id;
		view.load();
	}

	//パネル2
	panel = AFL.createPanel();
	panel.setChildStyle('BOTTOM');
	split.addChild(1,panel);

	button = AFL.createButton();
	button.setChildStyle('LEFT');
	button.setText('アップ');
	panel.addChild(button);
	button.onclick = function()
	{
		if(WIBS.dirSelectID > 0)
			WIBS.createUploadView(WIBS.dirSelectID);
	}
	
	button = AFL.createButton();
	button.setChildStyle('LEFT');
	button.setText('変更');
	panel.addChild(button);
	button.onclick = function()
	{
		var item = list.getSelectItem();
		if(item >= 0)
		{
			var input = AFL.createInputBox();
			var id = list.getItemValue(item);
			input.onEnter = function()
			{
				var name = input.getText();
				AFL.recvHttpTable(getURL()+"?cmd=file_rename",null,{'id':id,'file_name':name});
				view.load();
				input.close();
			}
			input.setTitle('ファイル名');
			input.setText(list.getItemText(item,0));
			input.setPos();
			input.show();
			
		}
	}

	button = AFL.createButton();
	button.setChildStyle('LEFT');
	button.setText('削除');
	panel.addChild(button);
	button.onclick = function()
	{
		var count = list.getItemCount();
		for(var i=0;i<count;i++)
		{
			if(list.isSelectItem(i))
			{
				var id = list.getItemValue(i);
				if(id < 0)
					id = -id;
				var url = AFL.sprintf("?cmd=file_remove&id=%d", id);
				AFL.recvHttpData(getURL() + url);
			}
		}
		view.load();
	}
	
	//ファイルリンク表示用
	var fileLink = AFL.createWindow();
	fileLink.setChildStyle('CLIENT');
	panel.addChild(fileLink);
	
	view.load = function()
	{
		function onLoadTree(datas)
		{
			tree.clearItem();
			//ツリー構造の作成
			var itemList = new Array();
			var item;
			item = tree.addItem('DIR LIST',true);
			item.setItemValue(datas[0]['file_id']);
			itemList[item.getItemValue()] = item;
			
			for(var i=1;datas[i];i++)
			{
				var data = datas[i];
				var id = data['file_id'];
				var parentItem = itemList[data['file_pid']];
				item = parentItem.addItem(data['file_name'],false);
				item.setItemValue(id);
				itemList[id] = item;
			}
			tree.selectItem(WIBS.dirSelectID);
		}
		AFL.recvHttpTable(getURL()+"?cmd=file_dir_list",onLoadTree);
		//view.loadList(id);
	}
	view.loadList = function()
	{
		function onLoadList(datas)
		{
			list.clearItem();
			for(var i=0;datas[i];i++)
			{
				var item;
				var data = datas[i];
				var id = data['file_id'];
				var name = data['file_name'];
				item = list.addItem(name);
				if(data['file_kind'] == 1)
				{
					list.setItemValue(item,-id);
					list.setItemWeight(item,0,'BOLD');
				}
				else
				{
					list.setItemValue(item,id);
				}
				list.setItemAlign(item,1,'right');
				list.setItemAlign(item,2,'right');
				list.setItemText(item,1,data['count']);
				list.setItemText(item,2,parseInt(data['file_size']/1024) + 'KB');
				list.setItemText(item,3,data['file_date']);
				list.setItemText(item,4, data['file_type']);
			}
		}
		if(WIBS.dirSelectID)
			AFL.recvHttpTable(getURL()+"?cmd=file_list",onLoadList,{'pid':WIBS.dirSelectID});
	}

	view.setPos();
	view.show();
	view.load();
	return view;
}
AFL.createIFrame = function()
{
	var f = AFL.createWindow('IFRAME');
	
	//f.frameBorder = 0;
	document.body.appendChild(f);
	var doc = f.contentDocument;
	doc.writeln("<body></body>");
	doc.close();
	//doc.innerHTML = "<body>444</body>";
	return f;
}

WIBS.createHtmlEditView = function()
{
	function getSelectText()
	{
		var text;
		var select;
		if(window.getSelection)
			text = window.getSelection();
		else
			text = document.selection.createRange().text;
		return text;
	}
	function insertSelectTag(tag)
	{
		try
		{
			if(window.getSelection)
			{
				var select = window.getSelection();
			//	var dumy = document.createElement('DIV');
			//	var df = select.getRangeAt(0).cloneContents();
			//	dumy.appendChild(df);
				document.execCommand('inserthtml', false, tag+doc.getSelection()); 
			}
			else
			{
				var range = document.selection.createRange();
				range.pasteHTML(tag);
			}
		}
		catch(e){}
	}	
	function setSelectTag(start,end)
	{
		try
		{
			if(window.getSelection)
			{
				var select = window.getSelection();
				var dumy = document.createElement('DIV');
				var df = select.getRangeAt(0).cloneContents();
				dumy.appendChild(df);
				document.execCommand('inserthtml', false, start+ dumy.innerHTML+end); 
			}
			else
			{
				var range = document.selection.createRange();
				range.pasteHTML(start+range.htmlText+end);
			}
		}
		catch(e){}
	}
	function delSelectTag()
	{
		try
		{
			if(window.getSelection)
			{
				var select = window.getSelection();
				document.execCommand('inserthtml', false, select); 
			}
			else
			{
				var range = document.selection.createRange();
				range.pasteHTML(range.txt);
			}
		}
		catch(e){}
	}
	function getSelectRange()
	{
		var range;
		if(window.getSelection)
		{
			range = window.getSelection().getRangeAt(0);
		}
		else
		{
			range = document.selection.createRange();
		}
		range.setTag = function(start,end)
		{
			try
			{
				if(window.getSelection)
				{
					var dumy = document.createElement('SPAN');
					var dumy2 = document.createElement('SPAN');
					var df = this.cloneContents();
					dumy.appendChild(df);
					dumy2.innerHTML = start+ dumy.innerHTML+end;
					range.surroundContents(dumy2.childNodes[0]);
				}
				else
				{
					range.pasteHTML(start+this.htmlText+end);
				}
			}
			catch(e){}
		}
		range.insertTag = function(tag)
		{
			//try
			{
				if(window.getSelection)
				{
					var dumy = document.createElement('SPAN');
					dumy.innerHTML = tag+ dumy.innerHTML;
					range.insertNode(dumy.childNodes[0]);
				}
				else
				{
					range.pasteHTML(tag+this.htmlText);
				}
			}
			//catch(e){}
		}
		return range;
	}


	function createLink()
	{
		var frame = AFL.createFrameWindow();
		frame.setTitle('リンク');
		var button = AFL.createButton();
		button.setChildStyle('RIGHT');
		button.setText('SET');
		button.setWidth(32);
		frame.addChild(button);
		
		var range = getSelectRange();
		button.onclick = function()
		{
			if(range)
				range.setTag(AFL.sprintf("<A href='%s'>",text.getText()),"</A>");
			else
				setSelectTag(AFL.sprintf("<A href='%s'>",text.getText()),"</A>");
			frame.close();
		}
		
		
		var text = AFL.createTextBox();
		text.setChildStyle('CLIENT');
		text.setText('http://');
		frame.addChild(text);
		
		frame.setPos();
		frame.show();
		frame.setTopMost(true);
		frame.setSize(320,48);
	}
	function createTool(name,width)
	{
		var editBold = AFL.createButton();
		editBold.style.fontSize = '10px';
		editBold.setChildStyle("LEFT");
		editBold.setWidth(width==null?24:width);
		editBold.style.cursor = 'pointer';
		editBold.setText(name);
		tools.addChild(editBold);
		return editBold;
	
	}

	var tab = AFL.createTab();

	var htmlEdit = AFL.createWindow();
	htmlEdit.setChildStyle("CLIENT");

	var textEdit = AFL.createWindow();
	textEdit.setChildStyle("CLIENT");
	
	var tools = AFL.createPanel();
	tools.setSize(24,24);
	tools.setChildStyle("TOP");
	htmlEdit.addChild(tools);

	var editTool = createTool('解');
	editTool.onmousedown = function(){delSelectTag();return false;}
	var editTool = createTool('左');
	editTool.onclick = function() {setSelectTag("<DIV align='left'>","</DIV>");return false;}
	var editTool = createTool('中');
	editTool.onclick = function() {setSelectTag("<DIV align='center'>","</DIV>");return false;}
	var editTool = createTool('右');
	editTool.onclick = function() {setSelectTag("<DIV align='right'>","</DIV>");return false;}
	var editTool = createTool('<<');
	editTool.onclick = function() {setSelectTag("<DIV style='margin-left:-4ex'>","</DIV>"); }
	var editTool = createTool('>>');
	editTool.onclick = function() {setSelectTag("<DIV style='margin-left:4ex'>","</DIV>");return false;}
	var editTool = createTool('A');
	editTool.onmousedown = function(){createLink();return false;}
	var editTool = createTool('B');
	editTool.onmousedown = function(){setSelectTag('<B>','</B>');return false;}
	var editTool = createTool('I');
	editTool.onclick = function(){setSelectTag('<I>','</I>');return false;}
	var editTool = createTool('U');
	editTool.onclick = function() {setSelectTag('<U>','</U>');return false;}
	var editTool = createTool('F1');
	editTool.onclick = function() {setSelectTag('<FONT size="1">','</FONT>');return false;}
	var editTool = createTool('F2');
	editTool.onclick = function() {setSelectTag('<FONT size="2">','</FONT>');return false;}
	var editTool = createTool('F3');
	editTool.onclick = function() {setSelectTag('<FONT size="3">','</FONT>');return false;}
	var editTool = createTool('F4');
	editTool.onclick = function() {setSelectTag('<FONT size="4">','</FONT>');return false;}
	var editTool = createTool('F5');
	editTool.onclick = function() {setSelectTag('<FONT size="5">','</FONT>');return false;}
	var editTool = createTool('F6');
	editTool.onclick = function() {setSelectTag('<FONT size="6">','</FONT>');return false;}
	var editTool = createTool('F7');
	editTool.onclick = function() {setSelectTag('<FONT size="7">','</FONT>');return false;}
	var editTool = createTool('FILE',48);
	editTool.onclick = function() 
	{
		var fileList = WIBS.createFileView();
		fileList.setSize(580,400);
		fileList.setPos();
		var range = getSelectRange();
		fileList.onExec = function(id,name)
		{
			textArea.focus();
			var tag = AFL.sprintf("<A HREF='?cmd=file_download&id=%d'>%s</A>",id,name);
			//insertSelectTag(tag);
			if(range)
				range.insertTag(tag);
			else
				insertSelectTag(tag);
			fileList.close();
		}
		return false;
	}
	var editTool = createTool('IMG',42);
	editTool.onclick = function() 
	{
		var fileList = WIBS.createFileView();
		fileList.setSize(580,400);
		fileList.setPos();
		var range = getSelectRange();
		fileList.onExec = function(id,name)
		{
			textArea.focus();
			var tag = AFL.sprintf("<IMAGE src='?cmd=file_download&id=%d' ALT='%s'>",id,name);
			if(range)
				range.insertTag(tag);
			else
				insertSelectTag(tag);
			fileList.close();
		}
		return false;
	}

	var edit = AFL.createWindow();
	edit.setChildStyle("CLIENT");
	edit.style.backgroundColor = 'white';
	htmlEdit.addChild(edit);

	var textArea = document.createElement("DIV");
	textArea.innerHTML = "<DIV></DIV>";
	textArea.contentEditable = 'true';
	textArea.style.margin = '1px';
	textArea.style.overflow = 'auto';
	edit.appendChild(textArea);
	
	var textAreaText = document.createElement("TEXTAREA");
	textAreaText.style.position = 'fixed';
	//textAreaText.style.overflow = 'auto';
	textEdit.appendChild(textAreaText);

	var textMove =  function()
	{
		textAreaText.style.width = this.getClientWidth() +'px';
		textAreaText.style.height = this.getClientHeight() +'px';
		return true;
	}
	var htmlMove = function()
	{
		textArea.style.width = this.getClientWidth()+'px';
		textArea.style.height = this.getClientHeight()+'px';
		return true;
	}
	textEdit.onSize.push(textMove);
	edit.onSize.push(htmlMove);
	tab.setName = function(name)
	{
		textArea.name = name;
	}
	tab.setValue = function(value)
	{
		textArea.innerHTML = value;
		textAreaText.value = value;
	}
	tab.getValue = function()
	{
		if(this.getSelectItem() == 0)
			return textArea.innerHTML;
		else
			return textAreaText.value;
	}
	tab.onChange = function(index)
	{
		if(this.getSelectItem() == 0)
			textArea.innerHTML = textAreaText.value;
		else
			textAreaText.value = textArea.innerHTML;
	}

	tab.addItem('HTML', htmlEdit);
	tab.addItem('TEXT', textEdit);
	

	return tab;
}
//============================================
//ログインウインドウの表示
//drawLogin
// 引数
// func ログイン処理が行われた場合の処理
//============================================
WIBS.loginWindow = null;
WIBS.onLogin = null;
function drawLogin(func)
{
	var loginWindow = WIBS.loginWindow;
	if(!loginWindow)
	{
		//ログインウインドウがなければ作成
		loginWindow = AFL.createFrameWindow();
		loginWindow.setTitle('LOGIN');
		loginWindow.setSize(320,140);
		WIBS.loginWindow = loginWindow;
		
		//パネルの設定
		var panel = AFL.createPanel();
		panel.setChildStyle('TOP');
		loginWindow.addChild(panel);
		var loginButton = AFL.createButton();
		loginButton.setChildStyle('LEFT');
		loginButton.setText('ログイン',true);
		panel.addChild(loginButton);
		var logoutButton = AFL.createButton();
		logoutButton.setChildStyle('LEFT');
		logoutButton.setText('ログアウト',true);
		panel.addChild(logoutButton);
		var messageText = AFL.createWindow();
		messageText.setSize(128,16);
		messageText.setChildStyle('LEFT');
		panel.addChild(messageText);
		
		//ログイン用の入力ボックス
		var list = AFL.createList();
		list.setChildStyle('CLIENT');
		loginWindow.addChild(list);
		list.addField('項目',128);
		list.addField('データ',128);
		list.addItem('ID');
		list.addItem('PASSWORD');
		list.setItemEdit(0,1,true);
		list.setItemEdit(1,1,true);
		list.setItemType(1,1,'password');
		
		list.setItemValue(0,0);
		list.setItemValue(1,1);
		list.setItemText(0,1,WIBS.userName);
		list.setItemText(1,1,WIBS.userPass);
		
		//ログイン処理
		var cflag = false;
		loginButton.onclick = function()
		{
			var data = list.getItemValue(0);
			if(data == 0)
			{
				user = list.getItemText(0,1);
				pass = list.getItemText(1,1);
			}
			else
			{
				user = list.getItemText(1,1);
				pass = list.getItemText(0,1);
			}
			if(isLogin(user,pass))
			{
				cflag = true;
				messageText.innerHTML = "ログイン成功";
				loginWindow.close();
				func();
				
			}
			else
				messageText.innerHTML = "ログイン失敗";
			//WIBS.login(id,pass);
		}
		loginWindow.onClose = function()
		{
			if(cflag)
				WIBS.loginWindow = null;
			return cflag;
		}
		logoutButton.onclick = function()
		{
			WIBS.login('guest','');
			list.setItemText(0,1,WIBS.userName);
			list.setItemText(1,1,WIBS.userPass);
		}
		list.setFieldLast();
	}
	loginWindow.setPos();
	loginWindow.show();
}
