//=========================================================
//JavaScript基本ファイル
//作成 Akihiko Oikawa
//========================================================
//名前空間の定義
var AFL = {}
//ファイルのインポート
AFL.importJS = function(url)
{
	if(typeof (importJS.IMPORTS) == 'undefined')
		importJS.IMPORTS = new Array();
	if(importJS.IMPORTS[url] == null)
	{
		var scCode = getHttpText(url);
		if(scCode)
		{
			var sc = document.createElement('SCRIPT');
			sc.text = scCode;
			document.body.appendChild(sc);
		}
		importJS.IMPORTS[url] = true;
	}
}
//HTMLデータをテキストに変換
AFL.htmlToText = function(s)
{
	var dumy = document.createElement("span");
	dumy.innerHTML = s;
	return dumy.firstChild.nodeValue;
}

	//sprintf(format,・・・);
AFL.sprintf = function()
{
	var args = AFL.sprintf.arguments;
	return AFL.vsprintf(args);
}
	//可変文字列フォーマット
AFL.vsprintf = function(args)
{
	if(args[0] == null)
		return '';
	var format = args[0];
	var paramIndex = 1;
	var dest = "";
	for(var i=0;format.charAt(i);i++)
	{
		if(format.charAt(i) == '%')
		{
			var flagZero = false;
			var num = 0;
			i++;
			if(format.charAt(i) == '0')
			{
				flagZero = true;
				i++
			}
			for(;format.charAt(i) >= '0' && format.charAt(i)<='9';i++)
			{
				num *= 10;
				num += parseInt(format.charAt(i));
			}
			switch(format.charAt(i))
			{
			case 's':
				var work = String(args[paramIndex++]);
				var len = num - work.length;
				dest += work;
				var len = num - work.length;
				if(len > 0)
				{
					for(j=0;j<len;j++)
						dest += ' ';
				}
				break;
			case 'd':
				var work = String(args[paramIndex++]);
				var len = num - work.length;
				if(len > 0)
				{
					var j;
					var c;
					if(flagZero)
						c = '0';
					else
						c = ' ';
					for(j=0;j<len;j++)
						dest += c;
				}
				dest += work;
			}
		}
		else
			dest += format.charAt(i);
	}
	return dest;
}
AFL.getAbsX = function(node)
{
	var value = parseInt(node.offsetLeft);
	while(node = node.parentNode)
	{
		if(typeof(node.offsetLeft)!='undefined')
			value += parseInt(node.offsetLeft);
		if(typeof(node.scrollLeft)!='undefined')
			value -= parseInt(node.scrollLeft);
	}
	return value;
}
AFL.getAbsY = function(node)
{
	var value = parseInt(node.offsetTop);
	while(node = node.parentNode)
	{
		if(typeof(node.offsetTop)!='undefined')
			value += parseInt(node.offsetTop);
		if(typeof(node.scrollTop)!='undefined')
			value -= parseInt(node.scrollTop);
	}
	return value;
}

//文字列の置換
//src 元文字列
//datas data[置換元] = 置換後
function replaceText(src,datas)
{
	var dest = new String();
	var i;
	var length = src.length;
	var flag;
	for(i=0;i<length;i++)
	{
		flag = true;
		for(index in datas)
		{
			var data = datas[index];
			if(src.substr(i,index.length).indexOf(index) == 0)
			{
				dest += data;
				flag = false;
				i += index.length - 1;
				break;
			}
		}
		if(flag)
			dest += src.charAt(i);
	}
	return dest;
}

//アドレスの取得、パラメータの削除
function getURL()
{
	var i;
	var url = '';
	var src = document.location.href;
	for(i=0;src.charAt(i) && src.charAt(i)!='?' && src.charAt(i)!='#';i++)
		url += src.charAt(i);
	return url;
}

//アドレスの取得、ファイル名の削除
function getPATH()
{
	var i;
	var path = document.location.href;
	var index = path.lastIndexOf("/");
	if(index >= 0)
		path = path.substring(0,index+1);
	return path;
}
//-------------------------------------------------
//POST用データの作成
// data[count][name] -> name1=data1&name2=data2/name1=data1&name2=data2
AFL.createPostText = function(outdata)
{
	var text = '';
	for(var i=0;outdata[i];i++)
	{
		if(i)
			text += '/';
		var flag = false;
		for(var index in outdata[i])
		{
			if(flag)
				text += '&';
			text += encodeURIComponent(index) + '=' + encodeURIComponent(outdata[i][index]);
			flag = true;
		}
	}
	return text;
}
//---------------------------------------------------------
//Cookie設定
//---------------------------------------------------------
AFL.setCookie = function(name,value)
{
	if(value!=null)
	{
		var date = new Date();
		date.setDate(date.getDate()+30);

		document.cookie =
			encodeURI(name) + "=" + encodeURI(value) + "; expires=" + date.toGMTString()+ ";path=/;";
	}
	else
	{
		var date = new Date();
		date.setDate(date.getDate()-1);
		document.cookie = encodeURI(name) + "= ; expires=" + date.toGMTString()+";";
	}
}

AFL.getCookie = function(name)
{
	//クッキー分解用
	function getCookies()
	{
		var dest = Array();
		var cookieData = document.cookie + ";"
		var index1=0;
		var index2;
		while((index2 = cookieData.indexOf("=",index1)) >= 0)
		{
			var name = cookieData.substring(index1,index2);
			var value = '';
			index1 = index2+1;
			index2 = cookieData.indexOf(";",index1);
			if(index2 == -1)
				break;
			value = cookieData.substring(index1,index2);
			if(dest[decodeURI(name)]==undefined)
				dest[decodeURI(name)] = decodeURI(value);
			index1 = index2+1;
			for(;cookieData.charAt(index1) == ' ';index1++);
		}
		return dest;
	}
	var cookies = getCookies();
	return cookies[name];
}

//---------------------------------------------------------
//データ変換
//---------------------------------------------------------
AFL.convertHttpTextData = function(text)
{
	var dest = "";
	var i;
	for(i=0;text.charAt(i);i++)
	{
		if(text.charAt(i) == '%')
		{
			var code = parseInt(text.charAt(++i) + text.charAt(++i),16);
			dest += String.fromCharCode(code);
		}
		else
			dest += text.charAt(i);
	}
	return dest;
}
//---------------------------------------------------------
//データが取得できているかチェック
//---------------------------------------------------------
function isHttpData(xmlHttp)
{
	try
	{
		if(xmlHttp.status == 200)
			return true;
	}
	catch(e){}
	return false;
}

//---------------------------------------------------------
//XMLの読み出し
//---------------------------------------------------------
AFL.getHttp = function(url,getData,postData,proc,data)
{
	var xmlHttp = null;
	if(window.XMLHttpRequest)
	{
		xmlHttp =  new XMLHttpRequest();
	}
	else if(window.ActiveXObject)
	{
		xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
		if(!xmlHttp)
			xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	var methodGET = "";
	if(getData)
	{
		var urlGET = url.indexOf('?');
		for(name in getData)
		{
			if(methodGET.length == 0 && urlGET == -1)
				methodGET += '?';
			else
				methodGET += '&';
			methodGET += encodeURIComponent(name) + '=' + encodeURIComponent(getData[name]);
		}
	}
	var methodPOST = "";
	if(postData)
	{
		for(name in postData)
		{
			if(methodPOST.length != 0)
				methodPOST += '&';
			methodPOST += encodeURIComponent(name) + '=' + encodeURIComponent(postData[name]);
		}	
	}

	try
	{
		url += methodGET;
		if(proc == null)
			xmlHttp.open('POST',url, false);
		else
		{
			xmlHttp.onreadystatechange = function()
			{
				if(xmlHttp.readyState==4)
				{
					proc(xmlHttp,data);
				}
			}
			xmlHttp.open('POST',url, true);
		}
		if(methodPOST.length == 0)
		{
			xmlHttp.send(null);
		}
		else
		{
			xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlHttp.send(methodPOST);
		}
	}
	catch (e)
	{
		alert("読み込みエラー");
		proc(xmlHttp,data);
		return null;
	}
	return xmlHttp;
	
}

//---------------------------------------------------------
//ヘッダ付き表形式データの取得
//---------------------------------------------------------
AFL.recvHttpTable = function(url,proc,methodGET,methodPOST)
{
	function getTableParam(text)
	{
		if(!text)
			return null;
		var lines = text.split('\n');
		if(lines.length == 0)
			return null;
		var data = lines[0].split(',');
		var i,j;
		var header = new Array();
		for(i=0;data[i];i++)
			header[i] = data[i];
		var count = i-1;
		var dest = new Array();
		for(j=0;lines[j+1];j++)
		{
			var data = lines[j+1].split(',');
			dest[j] = new Array();
			for(i=0;data[i]!=null;i++)
			{
				dest[j][header[i]] = unescape(data[i]);
			}
		}
		return dest;
	}

	function callback(xmlHttp,proc)
	{
		if(isHttpData(xmlHttp))
		{
			var dest = getTableParam(xmlHttp.responseText);
			proc(dest);
		}
		else
		{
			//データの取得に失敗
			proc(null);
		}
	}
	if(proc)
		return AFL.getHttp(url,methodGET,methodPOST,callback,proc);
	else
	{
		var xmlHttp = AFL.getHttp(url,methodGET,methodPOST);
		return getTableParam(xmlHttp.responseText);
	}
}
AFL.recvHttpData = function(url,proc,methodGET,methodPOST)
{
	function callback(xmlHttp,proc)
	{
		if(isHttpData(xmlHttp))
		{
			proc(xmlHttp.responseText);
		}
		else
		{
			//データの取得に失敗
			proc(null);
		}
	}
	if(proc)
		return AFL.getHttp(url,methodGET,methodPOST,callback,proc);
	else
	{
		var xmlHttp = AFL.getHttp(url,methodGET,methodPOST);
		return xmlHttp.responseText;
	}
}

//初期化コード
AFL.init = function()
{
	//イベントキャンセル処理
	this.cancel = function(e)
	{
		if(e && e.stopPropagation)
		{
			e.stopPropagation();
		}
		else
		{
			event.cancelBubble = true;
			event.returnValue = false;
		}
	}
	//イベント発生時のX座標
	this.getX = function(e)
	{
		if(e)
			return e.clientX;
		else
			return event.x;
	}
	//イベント発生時のY座標
	this.getY = function(e)
	{
		if(e)
			return e.clientY;
		else
			return event.y;
	}
	//イベントの追加
	this.addEvent = function(type,func)
	{
		if(window.addEventListener)
			addEventListener(type,func,true);
		else
		{
			if(type == 'resize')
				window.attachEvent('on'+type,func);
			else
				document.attachEvent('on'+type,func);
		}
	}
	function resize()
	{
		AFL.layoutWindow();
	}
	this.addEvent('resize',resize);
	
	this.getClientWidth = function()
	{
		var width;
		if(window.innertWidth)
			width = document.window.innertWidth;
		else if(document.documentElement.clientWidth)
			width = document.documentElement.clientWidth;
		else
			width = document.body.clientWidth;
		return width;
	}
	this.getClientHeight = function()
	{
		var height;
		if(window.innertHeight)
			height = document.window.innertHeight;
		else if(document.documentElement.clientHeight)
			height = document.documentElement.clientHeight;
		else
			height = document.body.clientHeight;
		return height;
	}
	
	this.KEYMAP = new Array();
	this.shiftKey = false;
	this.altKey = false;
	this.ctrlKey = false;
	
	//キーボード操作の記憶
	function keyup(e)
	{
		var code;
		if(e)
		{
			code = e.keyCode; 
			AFL.ctrlKey = typeof(e.modifiers) == 'undefined' ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK;
			AFL.shiftKey = typeof(e.modifiers) == 'undefined' ? e.shiftKey : e.modifiers & Event.SHIFT_MASK;
		}
		else
		{
			code = event.keyCode;
			AFL.ctrlKey = event.ctrlKey;
			AFL.shiftKey = event.shiftKey;
		}
		AFL.KEYMAP[code] = 0;
	} 
	this.addEvent('keyup',keyup);
	function keydown(e) 
	{
		var code;
		if(e)
		{
			code = e.keyCode; 
			AFL.ctrlKey = typeof(e.modifiers) == 'undefined' ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK;
			AFL.shiftKey = typeof(e.modifiers) == 'undefined' ? e.shiftKey : e.modifiers & Event.SHIFT_MASK;
		}
		else
		{
			code = event.keyCode;
			AFL.ctrlKey = event.ctrlKey; 
			AFL.shiftKey = event.shiftKey; 	
		}
		AFL.KEYMAP[code] = 1;
	}
	this.addEvent('keydown',keydown);
	
	this.setMoveNode = function(node)
	{
		AFL.mousedownX = AFL.mouseX;
		AFL.mousedownY = AFL.mouseY;
		var overNode = node;
		if(overNode)
		{
			AFL.setForground(overNode);
			if(!overNode.isSelectFlag())
			{
				AFL.mousedownNode = overNode;
				AFL.mousedownNodeX = overNode.getX();
				AFL.mousedownNodeY = overNode.getY();
			}
		}
		else
			AFL.mousedownNode = null;
	}
	//マウスダウンイベント
	function mousedown(e)
	{
		//イベント発生時の位置を記録
		AFL.mousedownX = AFL.getX(e);
		AFL.mousedownY = AFL.getY(e);
		var overNode = AFL.overNode;
		if(overNode)
		{
			AFL.setForground(overNode);
			if(!overNode.isSelectFlag())
			{
				AFL.mousedownNode = overNode;
				AFL.mousedownNodeX = overNode.getX();
				AFL.mousedownNodeY = overNode.getY();
			}
		}
		else
			AFL.mousedownNode = null;
	}
	this.addEvent('mousedown',mousedown);
	//マウス移動イベント
	function mousemove(e)
	{
		var x = AFL.getX(e);
		var y = AFL.getY(e);
		AFL.mouseX = x;
		AFL.mouseY = y;
		var overNode = AFL.mousedownNode;
		if(overNode)
		{
			x = x - AFL.mousedownX + AFL.mousedownNodeX;
			y = y - AFL.mousedownY + AFL.mousedownNodeY;
			overNode.setPos(x,y);
			AFL.cancel(e);
		}
	}
	this.addEvent('mousemove',mousemove);
	//マウスアップイベント
	function mouseup(e)
	{
		var node = AFL.mousedownNode;
		if(node)
		{
			if(node.onMoved)
				node.onMoved();
			AFL.mousedownNode = null;
		}
	}
	this.addEvent('mouseup',mouseup);

	//コールバック呼び出し
	AFL.callFunction = function(inst,funcs)
	{
		if(funcs)
		{
			for(var func in funcs)
			{
				var f = funcs[func];
				if(!f.__call && f.call)
				{
					f.__call = true;
					f.call(inst);
					f.__call = false;
				}
			}
		}
	}
	//ウインドウの再配置
	function layoutWindow(node)
	{
		function setSize(node,width,height)
		{
			if(width < 0)
				width = 0;
			if(height < 0)
				height = 0;
			node.__width = width;
			node.__height = height;
			node.style.width = node.__width + 'px';
			node.style.height = node.__height + 'px';
		}
		var childs;
		if(node == null)
		{
			childs = new Array();
			for(var i=0;AFL.windows[i];i++)
			{
				if(AFL.windows[i].__parentNode == null)
					childs.push(AFL.windows[i]);
			}
		}
		else
			childs = node.__childNodes;
	
		var layout = new Array();
		//優先順位の決定
		for(var index=0;childs[index];index++)
		{
			var child = childs[index];
			if(!child.isVisible())	//不可視属性ならスキップ
				continue;
			var priority = child.__childPriority;
			switch(child.__childStyle)
			{
			case 'LEFT':
			case 'RIGHT':
				priority += 100;
				break;
			case 'TOP':
			case 'BOTTOM':
				priority += 200;
				break;
			case 'NORMAL':
				continue;
			}			
			if(child.isTopMost())
				priority += 10000;
			layout.push({'priority':priority,'node':child});
		}
		
		//データのソート
		layout.sort(function(a,b){return b.priority - a.priority;});
		var cx1 = 0;
		var cy1 = 0;
		var clientWidth;
		var clientHeight;
		if(node)
		{
			cx1 = node.getClientX();
			cy1 = node.getClientY();
			clientWidth = node.getClientWidth();
			clientHeight = node.getClientHeight();
		}
		else
		{
			clientWidth = AFL.getClientWidth();
			clientHeight = AFL.getClientHeight();
		}
		var cx2 = cx1 + clientWidth;
		var cy2 = cy1 + clientHeight;
		for(var index in layout)
		{
			var child = layout[index].node;
			var wx = cx2 - cx1;
			var wy = cy2 - cy1;
			switch(child.__childStyle)
			{
			case 'LEFT':
				wx = child.getWidth();
				child.setPos(cx1,cy1);
				setSize(child,wx,wy);
				cx1 += wx;
				break;
			case 'RIGHT':
				wx = child.getWidth();
				cx2 -= wx;
				child.setPos(cx2,cy1);
				setSize(child,wx,wy);
				break;
			case 'TOP':
				wy = child.getHeight();
				child.setPos(cx1,cy1);
				setSize(child,wx,wy);
				cy1 += wy;
				break;
			case 'BOTTOM':
				wy = child.getHeight();
				cy2 -= wy;
				child.setPos(cx1,cy2);
				setSize(child,wx,wy);
				break;
			case 'CLIENT':
				child.setPos(cx1,cy1);
				setSize(child,wx,wy);
				break;
			}
			AFL.callFunction(child,child.onSize);
			layoutWindow(child);
		}
	}
	AFL.layoutWindow = function()
	{
		layoutWindow();
	}
	AFL.windows = new Array();

	AFL.setForground = function(node)
	{
		if(!node.isTopMost())
			node.style.zIndex = 100;
		function cmp(a,b)
		{
			var az = 0;
			var bz = 0;
			if(a.__childStyle == 'NORMAL')
				az = 1000;
			if(b.__childStyle == 'NORMAL')
				bz = 1000;
			return a.style.zIndex+az - (b.style.zIndex+bz);
		}
		var z = 1;
		var childs;
		var index;
		var parentNode = node.__parentNode;
		if(parentNode)
		{
			childs = parentNode.__childNodes;
		}
		else
		{
			childs = new Array();
			for(index in AFL.windows)
			{
				var w = AFL.windows[index];
				if(w.__parentNode == null)
				{
					childs.push(w);
				}
			}
		}
		childs.sort(cmp);
		for(index in childs)
		{
			var child = childs[index];
			if(!child.isTopMost())
			{
				child.style.zIndex = z;
				z++;
			}
		}
			
		node.setActive(true);
		if(parentNode)
		{
			AFL.setForground(parentNode);
		}
	}
	//ウインドウの作成
	AFL.createWindow = function(tag)
	{
		//ウインドウ用ノードの作成
		var node;
		if(tag)
			node = document.createElement(tag);
		else
			node = document.createElement('DIV');
		
		node.__x = 0;
		node.__y = 0;
		node.__height = 0;
		node.__width = 0;
		AFL.windows.push(node);
		node.style.overflow = 'hidden';
		node.style.zIndex = 1;
		node.onSize = new Array();
		node.onMove = new Array();
		var active = false;
		node.setActive = function(flag)
		{
			if(active != flag)
			{
				if(node.__onActive)
					node.__onActive(flag);
				if(node.onActive)
					node.onActive(flag);
				if(flag)
				{
					var parent = node.__parentNode;
					if(parent)
					{
						var childs = parent.__childNodes;
						for(var index in childs)
						{
							var n = childs[index];
							if(n != this)
								n.setActive(false);
						}
					}
					for(var index in AFL.windows)
					{
						var n = AFL.windows[index];
						if(n.__parentNode==null && n != this)
							n.setActive(false);
					}
				}
				else
				{
					var childs = node.__childNodes;
					for(var index in childs)
					{
						childs[index].setActive(false);
					}
				}
			}
			active = flag;
		}
		node.setBackgroundColor = function(value)
		{
			this.style.backgroundColor = value;
		}
		
		node.setAlpha = function(alpha)
		{
			this.style.filter = 'alpha(opacity=' + alpha + ')';
			this.style.MozOpacity = alpha / 100;
			this.style.opacity = alpha / 100;
		}
		node.isActive = function()
		{
			return active;
		}
		var topMost = false;
		node.isTopMost = function()
		{
			return topMost;
		}
		node.setTopMost = function(flag)
		{
			topMost = flag;
		}

		var clientX1 = 0;
		var clientY1 = 0;
		var clientX2 = 0;
		var clientY2 = 0;
		node.setClientMargin = function(x1,y1,x2,y2)
		{
			clientX1 = x1;
			clientY1 = y1;
			clientX2 = x2;
			clientY2 = y2;
		}
		var visible = true;
		node.setVisible = function(flag)
		{
			visible=flag;
			this.style.display = flag?'block':'none';
		}
		node.isVisible = function(){return visible;}
		node.layoutWindow = function(){layoutWindow(this);}
		//位置を絶対位置指定
		node.style.position = 'absolute';
		//境界の区別用に背景色の設定
		//node.style.backgroundColor= '#FFFF00';
		node.close = function()
		{
			//ウインドウを閉じるイベントがあるか
			if(this.onClose)
				if(this.onClose() == false)
					return;	//閉じない
					
			var parentNode = this.__parentNode;
			if(parentNode)
				parentNode.delChild(this);
			else
			{
				if(this.parentNode)
					document.body.removeChild(this);
				var windows = AFL.windows;
				for(var index in windows)
				{
					if(windows[index] == this)
					{
						windows.splice(index,1);
						break;
					}
				}
			}
		}
		node.setScroll = function(flag)
		{
			if(flag)
				this.style.overflow = "auto";
			else
				this.style.overflow = "hidden";
		}	
		//選択を許可
		var selectFlag = true;
		node.setSelectFlag = function(flag){selectFlag = flag;}
		node.isSelectFlag = function(){return selectFlag;}
		//親ウインドウノードの初期化
		node.__parentNode = null;
		//子ウインドウノード
		node.__childNodes = new Array();
		//子ウインドウの追加
		node.addChild = function(child)
		{
			if(child.__parentNode)
				child.__parentNode.delChild(child);
			child.__parentNode = this;
			this.__childNodes.push(child);
			this.appendChild(child);
			if(child.__childPriority == 0)
				child.__childPriority = -this.__childNodes.length;
			child.style.display = 'block';
			layoutWindow(this);
		}
		//子ウインドウの削除
		node.delChild = function(child)
		{
			var windows = AFL.windows;
			for(var index in windows)
			{
				if(windows[index] == child)
				{
					windows.splice(index,1);
					break;
				}
			}
			var childs = this.__childNodes;
			for(var index in childs)
			{
				if(child)
				{
					if(childs[index] == child)
					{
						child.__parentNode = null;
						childs.splice(index,1);
						child.parentNode.removeChild(child);
						break;
					}
				}
			}
		}
		//子ウインドウ時のスタイル
		node.__childStyle = 'NORMAL';
		//レイアウト時の優先順位
		node.__childPriority = 0;
		//クライアントスタイルの設定
		node.setChildStyle = function(s)
		{
			this.__childStyle = s;
		}
		//クライアント領域のサイズを返す
		node.getClientX = function()
		{
			return clientX1;
		}
		node.getClientY = function()
		{
			return clientY1;
		}
		node.getClientWidth = function()
		{
			return this.__width-clientX2;
		}
		node.getClientHeight = function()
		{
			return this.__height-clientY2;
		}
		//移動フラグの設定
		node.__moveFlag = false;
		//移動の許可設定
		node.setMoveFlag = function(flag)
		{
			if(flag)
				selectFlag = false;
			this.__moveFlag = flag;
		}
		//位置指定メソッド
		node.movePos = function(x,y)
		{
			this.setPos(this.__x+x,this.__y+y);
		}
		node.setPos = function(x,y)
		{
			if(x == null || y == null)
			{
				if(this.__parentNode)
				{
					var p = this.__parentNode;
					x = (p.getClientWidth() -  this.__width) / 2;
					y = (p.getClientHeight() - this.__height) / 2;
				}
				else
				{
					x = (AFL.getClientWidth() -  this.__width) / 2;
					y = (AFL.getClientHeight() - this.__height) / 2;
				}
			}
			this.__x = parseInt(x);
			this.__y = parseInt(y);
			this.style.left = this.__x + 'px';
			this.style.top = this.__y + 'px';
			AFL.callFunction(this,this.onMove);
		}
		//位置取得
		node.getX = function()
		{
			return this.__x;
		}
		node.getY = function()
		{
			return this.__y;
		}
		node.getAbsX = function()
		{
			var x = this.__x;
			if(this.__parentNode)
				x += this.__parentNode.getAbsX();
			return x;
		}
		node.getAbsY = function()
		{
			var y = this.__y;
			if(this.__parentNode)
				y += this.__parentNode.getAbsY();
			return y;
		}
		node.getWidth = function()
		{
			return this.__width;
		}
		node.getHeight = function()
		{
			return this.__height;
		}
		node.setWidth = function(width)
		{
			if(width < 0)
				width = 0;
			this.__width = width;
			this.style.width = width + 'px';
			AFL.callFunction(this,this.onSize);
			layoutWindow(this);
		}
		node.setHeight = function(height)
		{
			if(height < 0)
				height = 0;
			this.__height = height;
			this.style.height = height + 'px';
			AFL.callFunction(this,this.onSize);
			layoutWindow(this);
		}
		//サイズ指定メソッド
		node.setSize = function(width,height,redraw)
		{
			if(width < 0)
				width = 0;
			if(height < 0)
				height = 0;
			this.__width = width;
			this.__height = height;
			this.style.width = width + 'px';
			this.style.height = height + 'px';
			//if(redraw!=false)
			{
				AFL.callFunction(this,this.onSize);
				layoutWindow(this);
			}
		}
		//最上位ウインドウの取得
		node.getTopWindow = function()
		{
			var window = this;
			while(window.__parentNode)
			{
				window = window.__parentNode;
			}
			return window;
		}
		//内容設定用
		node.setHTML = function(value)
		{
			this.innerHTML = value;
		}
		node.onmousedown = function(e)
		{
			if(selectFlag && e)
				AFL.cancel(e);
			return selectFlag;
		}
		//マウスと重なったら自身を記憶
		node.onmouseover = function(e)
		{
			if(this.__moveFlag || selectFlag)
			{
				AFL.overNode = this;
				AFL.cancel(e);
			}
			return true;
		}
		//マウスが離れたら登録を解除
		node.onmouseout = function()
		{
			if(AFL.overNode == this)
				AFL.overNode = null;
			return true;
		}
/*		node.onselectstart = function(e)
		{
			return selectFlag;
		}
*/		//ノードを本文へ追加
		node.show = function()
		{
			this.layoutWindow();
			this.style.display = 'block';
			AFL.setForground(node);
		}
		node.style.display = 'none';
		document.body.appendChild(node);
		
		//初期設定
		node.setSize(200,100);
		node.setPos(0,0);
		node.layoutWindow();
		//ノードを戻す
		return node;
	}
	function createFrameBarNW()
	{
		var node = AFL.createWindow();
		node.setSelectFlag(false);
		node.style.backgroundColor = '#CCCCCC';
		node.style.borderStyle = 'solid';
		node.style.borderWidth = '1px 0px 0px 1px';
		node.style.borderColor = "white";
		node.style.cursor = "nw-resize";
		node.style.zIndex = 2;
		return node;
	}
	function createFrameBarNE()
	{
		var node = AFL.createWindow();
		node.setSelectFlag(false);
		node.style.backgroundColor = '#CCCCCC';
		node.style.borderWidth = '1px 1px 0px 0px';
		node.style.borderStyle = 'solid';
		node.style.borderTopColor = "white";
		node.style.borderRightColor = "black";
		node.style.cursor = "ne-resize";
		node.style.zIndex = 2;
		return node;
	}
	function createFrameBarSW()
	{
		var node = AFL.createWindow();
		node.setSelectFlag(false);
		node.style.backgroundColor = '#CCCCCC';
		node.style.borderStyle = 'solid';
		node.style.borderWidth = '0px 0px 1px 1px';
		node.style.borderLeftColor = "white";
		node.style.borderBottomColor = "black";
		node.style.cursor = "sw-resize";
		node.style.zIndex = 2;
		return node;
	}
	function createFrameBarSE()
	{
		var node = AFL.createWindow();
		node.style.backgroundColor = '#CCCCCC';
		node.setSelectFlag(false);
		node.style.borderWidth = '0px 1px 1px 0px';
		node.style.borderStyle = 'solid';
		node.style.borderColor = "black";
		node.style.cursor = "se-resize";
		node.style.zIndex = 2;
		return node;
	}
	
	function createFrameBarX()
	{
		var node = AFL.createWindow();
		node.setSelectFlag(false);
		node.style.backgroundColor = '#CCCCCC';
		node.style.borderWidth = '0px 1px';
		node.style.borderStyle = 'solid';
		node.style.borderLeftColor = "white";
		node.style.borderRightColor = "black";
		node.style.cursor = "e-resize";
		node.style.zIndex = 2;
		return node;
	}
	function createFrameBarY()
	{
		var node = AFL.createWindow();
		node.setSelectFlag(false);
		node.style.backgroundColor = '#CCCCCC';
		node.style.borderWidth = '1px 0px';
		node.style.borderStyle = 'solid';
		node.style.borderTopColor = "white";
		node.style.borderBottomColor = "black";
		node.style.cursor = "n-resize";
		node.style.zIndex = 2;
		return node;
	}
	function createTitle()
	{
		var node = AFL.createWindow();
		node.setSelectFlag(false);
		node.style.borderColor = '#BBBBBB';
		node.style.borderWidth = '1px';
		node.style.borderStyle = 'solid';
		node.style.color = 'white';
		node.style.backgroundColor = '#AAAAFF';
		node.style.cursor = "pointer";
		node.style.zIndex = 2;
		return node;
	}

	//フレームウインドウの作成
	this.createFrameWindow = function(tag)
	{
		var frame = AFL.createWindow(tag);
		frame.setMoveFlag(true);
		frame.__titleSize = 16;
		frame.__borderSize = 5;
		
		//クライアント領域
		var client = AFL.createWindow();
		client.setMoveFlag(false);
		frame.addChild(client);
		//タイトル設定
		var title = createTitle();
		title.setSelectFlag(false);
		frame.addChild(title);

		frame.__onActive = function(flag)
		{
			title.style.backgroundColor = flag?'#5555FF':'#AAAAFF';
		}


		var titleText = AFL.createWindow();
		titleText.setSelectFlag(false);
		titleText.setChildStyle('CLIENT');
		title.addChild(titleText);
		frame.setTitle = function(value)
		{
			titleText.innerHTML = value;
		}
		var titleClose = AFL.createButton();
		title.addChild(titleClose);
		titleClose.setChildStyle('RIGHT');
		titleClose.setText('×');
		titleClose.setSize(17,14);
		titleClose.__childPriority = 2;
		var titleMax = AFL.createButton();
		title.addChild(titleMax);
		titleMax.setChildStyle('RIGHT');
		titleMax.setText('□');
		titleMax.setSize(17,14);
		titleMax.__childPriority = 1;
		var titleMin = AFL.createButton();
		title.addChild(titleMin);
		titleMin.setChildStyle('RIGHT');
		titleMin.setText('＿');
		titleMin.setSize(17,14);
		titleMin.__childPriority = 0;
		var stat = 'NORMAL';
		var normalX = 0;
		var normalY = 0;
		var normalWidth = 0;
		var normalHeight = 0;
		titleClose.onclick = function()
		{
			frame.close();
		}
		titleMin.onclick = function()
		{
			if(stat == 'NORMAL')
			{
				normalX = frame.__x;
				normalY = frame.__y;
				normalWidth = frame.__width;
				normalHeight = frame.__height;
			}else if(stat == 'MIN')
			{
				stat = 'NORMAL';
				frame.setPos(normalX,normalY);
				frame.setSize(normalWidth,normalHeight);
				frame.setMoveFlag(true);
				frame.setBorderMove(true);
				return false;
			}
			stat = 'MIN';
			frame.setPos(normalX,normalY);
			frame.setSize(normalWidth,frame.__titleSize+frame.__borderSize*2);
			frame.setBorderMove(false);
			frame.setMoveFlag(true);
		}
		titleMax.onclick = function()
		{
			if(stat == 'NORMAL')
			{
				normalX = frame.__x;
				normalY = frame.__y;
				normalWidth = frame.__width;
				normalHeight = frame.__height;
			}else if(stat == 'MAX')
			{
				stat = 'NORMAL';
				frame.setPos(normalX,normalY);
				frame.setSize(normalWidth,normalHeight);
				frame.setMoveFlag(true);
				frame.setBorderMove(true);
				return false;
			}
			stat = 'MAX';
			var width = frame.getParentClientWidth();
			var height = frame.getParentClientHeight();
			frame.setPos(0,0);
			frame.setSize(width,height);
			frame.setMoveFlag(false);
			frame.setBorderMove(false);
			return false;
		}
		frame.getParentClientWidth = function()
		{
			var width;
			var parent = this.__parentNode;
			if(parent == null)
			{
				if(window.innertWidth)
					width = document.window.innertWidth;
				else if(document.documentElement.clientWidth)
					width = document.documentElement.clientWidth;
				else
					width = document.body.clientWidth;
			}
			else
				width = parent.getClientWidth();
			return width;
		}
		frame.getParentClientHeight = function()
		{
			var height;
			var parent = this.__parentNode;
			if(parent == null)
			{
				if(window.innertHeight)
					height = document.window.innertHeight;
				else if(document.documentElement.clientHeight)
					height = document.documentElement.clientHeight;
				else
					height = document.body.clientHeight;
			}
			else
				height = parent.getClientHeight();
			return height;
		}
		//フレームの設定
		var frameX1 = createFrameBarX();	//左
		frame.addChild(frameX1);
		var frameX2 = createFrameBarX();	//右
		frame.addChild(frameX2);
		var frameY1 = createFrameBarY();	//上
		frame.addChild(frameY1);
		var frameY2 = createFrameBarY();	//下
		frame.addChild(frameY2);
	
		var frameNW = createFrameBarNW();	//左上
		frame.addChild(frameNW);
		var frameNE = createFrameBarNE();	//右上
		frame.addChild(frameNE);
		var frameSW = createFrameBarSW();	//左下
		frame.addChild(frameSW);
		var frameSE = createFrameBarSE();	//右下
		frame.addChild(frameSE);
		frame.setBorderMove = function(flag)
		{
			frameX1.setMoveFlag(flag);
			frameX2.setMoveFlag(flag);
			frameY1.setMoveFlag(flag);
			frameY2.setMoveFlag(flag);
			frameNW.setMoveFlag(flag);
			frameNE.setMoveFlag(flag);
			frameSW.setMoveFlag(flag);
			frameSE.setMoveFlag(flag);
		}
		frame.setBorderMove(true);
		//クライアント領域のコンテンツ設定
		frame.setHTML = function(value)
		{
			client.innerHTML = value;
		}
		//子ウインドウの追加
		frame.addChild = function(child)
		{
			if(child.__parentNode)
				child.__parentNode.delChild(child);
			child.__parentNode = this;
			this.__childNodes.push(child);
			client.addChild(child);
			child.style.display = 'block';
			layoutWindow(this);
		}
	
		frame.getClientWidth = function()
		{
			var border = this.__borderSize;
			return this.__width - border*2;
		}
		frame.getClientHeight = function()
		{
			var border = this.__borderSize;
			return this.__height - border*2 - this.__titleSize;
		}
		//ウインドウサイズ変更時の処理
		function onSize()
		{
			var width = this.__width;
			var height = this.__height;
			var border = this.__borderSize;
			var titleSize = this.__titleSize;
			
			if(width < border*2)
			{
				width = border*2;
				this.style.width = width + 'px';
				this.__width = width;
			}
			if(height < border*2)
			{
				height = border*2;
				this.style.height = height + 'px';
				this.__height = height;
			}
			client.setPos(border,border+titleSize);
			client.setSize(width-border*2,height-titleSize-border*2);
			title.setPos(border,border);
			title.setSize(width-border*2-2,this.__titleSize-2);
			layoutWindow(title);
			frameX1.setPos(0,border);
			frameX1.setSize(border-2,height-border*2);
			frameX2.setPos(width-border,border);
			frameX2.setSize(border-2,height-border*2);
			frameY1.setPos(border,0);
			frameY1.setSize(width-border*2,border-2);
			frameY2.setPos(border,height-border);
			frameY2.setSize(width-border*2,border-2);
			frameNW.setPos(0,0);
			frameNW.setSize(border-1,border-1);
			frameNE.setPos(width-border,0);
			frameNE.setSize(border-1,border-1);
			frameSW.setPos(0,height-border);
			frameSW.setSize(border-1,border-1);
			frameSE.setPos(width-border,height-border);
			frameSE.setSize(border-1,border-1);
		}
		//タイトルサイズ変更時のフォント指定
		function onSizeTitle()
		{
			var height = this.__height;
			this.style.fontSize = height - 3 + 'px';
		}
		//フレーム移動時の処理
		function onMoveFrame()
		{
			var border = frame.__borderSize;
			switch(this)
			{
			case frameX1:
				AFL.mousedownX += frameX1.__x;
				var x = frame.__x+frameX1.__x;
				var width = frame.__width - frameX1.__x;
				frame.setSize(width,frame.__height);
				frame.setPos(x,frame.__y);
				break;
			case frameX2:
				var width = frameX2.__x+border;
				frame.setSize(width,frame.__height);
				break;
			case frameY1:
				AFL.mousedownY += frameY1.__y;
				var y = frame.__y+frameY1.__y;
				var height = frame.__height - frameY1.__y;
				frame.setSize(frame.__width,height);
				frame.setPos(frame.__x,y);
				break;
			case frameY2:
				var height = frameY2.__y+border;
				frame.setSize(frame.__width,height);
				break;
			case frameNW:
				AFL.mousedownX += frameNW.__x;
				AFL.mousedownY += frameNW.__y;
				var x = frame.__x+frameNW.__x;
				var width = frame.__width - frameNW.__x;
				var y = frame.__y+frameNW.__y;
				var height = frame.__height - frameNW.__y;
				frame.setSize(width,height);
				frame.setPos(x,y);
				break;
			case frameNE:
				AFL.mousedownY += frameNE.__y;
				var width = frameNE.__x+border;
				var y = frame.__y+frameNE.__y;
				var height = frame.__height - frameNE.__y;
				frame.setSize(width,height);
				frame.setPos(frame.__x,y);
				break;
			case frameSW:
				AFL.mousedownX += frameSW.__x;
				var x = frame.__x+frameSW.__x;
				var width = frame.__width - frameSW.__x;
				var height = frameSW.__y+border;
				frame.setSize(width,height);
				frame.setPos(x,frame.__y);
				break;
			case frameSE:
				var width = frameSE.__x+border;
				var height = frameSE.__y+border;
				frame.setSize(width,height);
				break;
			
			}
		}
		//イベントの追加
		frame.onSize.push(onSize);
		title.onSize.push(onSizeTitle);
		frameX1.onMove.push(onMoveFrame);
		frameX2.onMove.push(onMoveFrame);
		frameY1.onMove.push(onMoveFrame);
		frameY2.onMove.push(onMoveFrame);
		frameNW.onMove.push(onMoveFrame);
		frameNE.onMove.push(onMoveFrame);
		frameSW.onMove.push(onMoveFrame);
		frameSE.onMove.push(onMoveFrame);
		return frame;
	}
	//分割ウインドウの作成
	this.createSplitWindow = function()
	{
		var node = AFL.createWindow();
		node.setChildStyle('CLIENT');
		node.__barPos = 200;	//バーの位置
		node.__barSize = 5;		//バーの太さ
		node.__barStyle = 0;	//バーの種類 0:縦 1:横
		node.__barBase = 0;		//位置の基準 0:左もしくは上 1:右もしくは下
		
		//分割バーの作成
		var bar = AFL.createWindow();
		bar.setMoveFlag(true);
		bar.style.backgroundColor = '#CCCCCC';
		bar.style.border = '1px';
		bar.style.borderStyle = 'solid';
		bar.style.borderColor = "white black black white";
		node.addChild(bar);
		//バーの位置の設定
		node.setSplitPos = function(value)
		{
			this.__barPos = value;
		}
		//バーの種類の設定
		node.setSplitStyle = function(style)
		{
			this.__barStyle = style;
		}
		var client = new Array();
		client[0] = AFL.createWindow();
		client[1] = AFL.createWindow();
		client[0].setSelectFlag(true);
		client[1].setSelectFlag(true);
		node.addChild(client[0]);
		node.addChild(client[1]);
		
		var addChild = node.addChild;
		//分割index付きで子ウインドウの追加
		node.addChild = function(index,node)
		{
			if(node != null)
				client[index].addChild(node);
			else
				node.call(addChild,index);
		}
		//サイズ変更時の処理
		function onSize()
		{
			var width = this.__width;
			var height = this.__height;
			var barSize = this.__barSize;
			if(this.__barStyle)
			{
				//上下分割処理
				if(this.__barBase == 0)
					bar.setPos(0,node.__barPos);
				else
					bar.setPos(0,height-node.__barPos);
				bar.setSize(width-2,barSize-2);
				bar.style.cursor = 'n-resize';
			}
			else
			{
				//左右分割処理
				if(this.__barBase == 0)
					bar.setPos(node.__barPos,0);
				else
					bar.setPos(width-node.__barPos,0);
				bar.setSize(barSize-2,height-2);
				bar.style.cursor = 'e-resize';
			}
		}
		node.onSize.push(onSize);
		//バー移動時の処理
		function onBarMove()
		{
			var barSize = node.__barSize;
			var width = node.__width - barSize;
			var height = node.__height - barSize;
			var x = this.__x;
			var y = this.__y;
			if(node.__barStyle)
			{
				//上下分割処理
				if(y < 0)
					y = 0;

				if(node.__barBase == 0)
					node.__barPos = y;
				else
					node.__barPos = height - y;

				if(y > height)
					y = height;
				bar.setPos(0,y);

				client[0].setPos(0,0);
				client[0].setSize(width+barSize,bar.__y);
				client[1].setPos(0,bar.__y+barSize);
				client[1].setSize(width+barSize,height - bar.__y);
			}
			else
			{
				//左右分割処理
				if(x < 0)
					x = 0;

				if(node.__barBase == 0)
					node.__barPos = x;
				else
					node.__barPos = width - x;

				if(x > width)
					x = width;
				bar.setPos(x,0);

				client[0].setPos(0,0);
				client[0].setSize(bar.__x,height+barSize);
				client[1].setPos(bar.__x+barSize,0);
				client[1].setSize(width - bar.__x,height+barSize);
			}
		}
		bar.onMove.push(onBarMove);
		return node;
	}
	//フォントサイズの取得
	this.getFontSize = function(value,srcNode)
	{
		var node = document.createElement('span');
		if(srcNode != null)
		{
			for(index in srcNode.style.font)
			{
				node.style.font[index] = srcNode.style.font[index];
			}
			node.style.lineHeight = srcNode.style.fontSize;
		}
		document.body.appendChild(node);
		node.innerHTML = value;
		if(node.offsetHeight == 0)
			node.style.position = 'absolute';
		var size = {width:node.offsetWidth,height:node.offsetHeight};
		document.body.removeChild(node);
		return size;
	}
	this.createEditBox = function()
	{
		var node = AFL.createWindow();
		var input = document.createElement('TEXTAREA');
		node.appendChild(input);
		node.style.backgroundColor = 'white';
		with(input.style)
		{
			backgroundColor = 'transparent';
			margin = 0;
			padding = 0;
			borderWidth = 0;
		}
		function onSize()
		{
			input.style.width = this.getClientWidth() + 'px';
			input.style.height = this.getClientHeight() + 'px';
		}
		node.onSize.push(onSize);
		node.setText = function(value)
		{
			input.value = value;
		}
		node.getText = function()
		{
			return input.value;
		}
		node.setReadOnly =function(flag)
		{
			input.readOnly = flag;
		}
		return node;
	
	}
	//テキストボックスの作成
	this.createTextBox = function()
	{
		var node = AFL.createWindow('input');
		with(node.style)
		{
			margin = 0;
			padding = 0;
			borderWidth = 0;
		}
		node.setText = function(value)
		{
			node.value = value;
		}
		node.getText = function()
		{
			return node.value;
		}
		node.onkeypress = function(e)
		{
			if(AFL.KEYMAP[13] && node.onEnter)
				node.onEnter();
		}
		node.setReadOnly =function(flag)
		{
			input.readOnly = flag;
		}
		return node;
	}
	//ボタンの作成
	this.createButton = function(type)
	{
		var node = AFL.createWindow();
		var button = document.createElement('input');
		if(type == null)
			button.type = 'button';
		else
			button.type = type;
		node.style.backgroundColor = 'transparent';
		node.appendChild(button);
		node.onSize.push(onSize);

		//ボタンスタイル
		with(button.style)
		{
			fontFamily = 'monospace';
			width = '100%';
			height = '100%';
			position = "absolute";
			fontSize = '12px';
			textAlign = 'center';
			margin = 0;
			padding = 0;
			fontWeight = '500';
			borderWidth = '1px';
			borderStyle = 'solid';
			borderColor = 'white gray gray white';
			backgroundColor = "silver";
		}
		//マウスによるスタイル変更
		button.onmouseover = function()
		{
			this.style.backgroundColor = "#dddddd";
		}
		button.onmouseout = function()
		{
			this.style.borderColor = "white black black white";
			this.style.backgroundColor = "silver";
		}
		button.onmousedown = function()
		{
			this.style.borderColor = "black white white black";
			return false;
		}
		button.onmouseup = function()
		{
			this.style.borderColor = "white black black white";
		}
		//ボタンテキストの設定
		var resize = false;
		node.setText = function(text,flag)
		{
			button.value = text;
			if(flag)
			{
				resize = true;
				button.style.width = 'auto';
				if(button.offsetWidth == 0)
				{
					var size = AFL.getFontSize(text,node);
					this.setWidth(size.width*1.1);
				}
				else
					this.setWidth(button.offsetWidth*1.1);
				button.style.width = '100%';
			}
			else
				resize = false;
		}
		//ボタンテキストの取得
		node.getText = function()
		{
			return button.value;
		}
		//ボタンの高さによってフォントサイズの調整
		function onSize()
		{
			var width = this.__width-1;
			var height = this.__height-1;
			if(width < 1)
				width = 1;
			if(height < 1)
				height = 1;
			button.style.width = width + "px";
			button.style.height = height + "px";
			height -= 6;//(height*0.7);
			if(height < 0)
				height = 0;
			button.style.fontSize = height + 'px';
			
			if(resize)
			{
				button.style.width = 'auto';
				if(button.offsetWidth == 0)
				{
					var size = AFL.getFontSize(button.value,node);
					this.setWidth(parseInt(size.width*1.1));
				}
				else
					this.setWidth(button.offsetWidth*1.1);
				button.style.width = width+'px';
			}
		}
		//デフォルトサイズの設定
		node.setSize(64,24);
		return node;
	}
	//リストビューの作成
	this.createList = function()
	{
		//フィールド作成
		function createField()
		{
			//ヘッダー領域
			var fnode = AFL.createWindow();
			fieldsHeader.push(fnode);
			fnode.setChildStyle('LEFT');
			
			//データ領域
			var dnode = AFL.createWindow();
			data.addChild(dnode);
			fnode.__dnode = dnode;
			
			fnode.onmousedown = function(e)
			{
				box.style.borderColor = "black white white black";
				AFL.cancel(e);
				return false;
			}
			fnode.onmouseup = function()
			{
				box.style.borderColor = "white black black white";
				return true;
			}
			fnode.onmouseout = function()
			{
				box.style.borderColor = "white black black white";
			}
			fnode.onclick = function()
			{
				for(var i=0;fieldsHeader[i] != this;i++);
				if(sortEnable)
					listNode.sort(i,!sort);
				return true;
			}
			var resize = false;
			function onSize()
			{
				resize = true;
				var width = this.__width-2;
				var height = this.__height-2;
				if(width < 0) width = 0;
				if(height < 0) height = 0;
				box.style.width = width+'px';
				box.style.height = height+'px';
				mpoint.setPos(this.__x + this.__width - mpoint.__width/2,0);
				mpoint.setSize(mpoint.__width, this.__height);
				dnode.setPos(this.__x,0);
				dnode.setWidth(this.__width);
				resize = false;
			}
			fnode.onSize.push(onSize);
			
			var box = document.createElement('DIV');
			box.style.cursor = "pointer";
			with(box.style)
			{
				borderWidth = '1px';
				borderColor = 'white gray gray white';
				borderStyle = 'solid';
			}
			fnode.appendChild(box);

			var text = document.createElement('DIV');
			with(text.style)
			{
				position = 'relative';
				left = '3px';
				backgroundColor = 'silver';
				whiteSpace = "nowrap";
				overflow = 'hidden';
				backgroundColor = 'transparent';
			}
			box.appendChild(text);

			var mpoint = AFL.createWindow();
			mpoint.setMoveFlag(true);
			mpoint.setSize(16,0);
			mpoint.style.cursor = 'w-resize';
			mpoint.style.zIndex = 100;
			mpoint.style.backgroundColor = 'transparent';
			
			function onHeaderMove()
			{
				if(!resize)
				{
					var x = this.__x;
					var width = this.__x - fnode.__x + this.__width/2;
					if(width < 4)
					{
						x =  fnode.__x+this.__width/2;
						width = 4;
					}
					fnode.setSize(width,fnode.__height);
					header.layoutWindow();
				}
			}
			mpoint.onMove.push(onHeaderMove);
			
			fnode.getText = function()
			{
				return text.innerHTML;
			}
			fnode.setText = function(value)
			{
				text.innerHTML = value;
			}
			header.addChild(mpoint);
			header.addChild(fnode);
			
			return fnode;
		}

		//アイテム入力領域の作成(IE対策用)
		function createInputNode(type)
		{
			var moveStartFlag = false;
			var text;
			type = String(type).toUpperCase();
			if(type == 'PLAIN')
				text = document.createElement('DIV');
			else
			{
				text = document.createElement('INPUT');
				text.multiple = true;
			}
			text.name = '__dumy';
			text.style.cursor = "pointer";
			text.style.overflow = 'hidden';
			text.__readOnly = false;
			if(type == null || type == 'UNDEFINED' || type=='INPUT')
			{
				text.type = 'text';
			}
			else
			{
				text.type = type;
			}
			text.setValue = function(value)
			{
				if(this.tagName == 'INPUT')
					this.value = value;
				else
					this.innerHTML = value;
			}
			text.getValue = function()
			{
				if(this.tagName == 'INPUT')
					return this.value;
				else
					return this.innerHTML;
			}
			text.onfocus = function()
			{
				if(!this.__readOnly && this.keepValue==null)
				{
					this.edit();
				}
			}
			text.onblur = function()
			{
				this.style.cursor = "pointer";
				if(this.__readOnly)
					this.readOnly = true;
				if(this.value!=this.keepValue && listNode.onItemText)
				{
					var box = this.parentNode;
					var row = box.getRow();
					var col = box.getCol();
					listNode.onItemText(row,col);
				}
				this.keepValue = null;
				if(activeText == this)
					activeText = null;
			}
			text.onkeypress = function()
			{
				if(AFL.KEYMAP[27])
				{
					if(this.keepValue != null)
						this.value = this.keepValue;
					this.blur();
				}
				else if(AFL.KEYMAP[13])
				{
					listNode.selectItem(-1,false);
					this.blur();
				}
				return true;
			}
			text.ondblclick = function()
			{
				var box = this.parentNode;
				var row = box.getRow();
				if(listNode.onItemDblClick)
				{
					listNode.onItemDblClick(row,box.getCol());
					this.blur();
					return false;
				}
				return true;
			}
			text.keepValue = null;
			text.onmouseup = function(e)
			{
				moveStartFlag = false;
				return true;
			}
			text.onmousedown = function(e)
			{
				var row = this.parentNode.getRow();
				//選択の解除
				if(!AFL.ctrlKey)
					listNode.selectItem(-1,false);
				//選択の反転
				listNode.selectItem(row,!listNode.isSelectItem(row));
				if(this.readOnly && listNode.onItemMove)
				{
					moveStartFlag = true;
					return false;
				}
				return true;
			}
			text.edit = function()
			{
				this.readOnly = false;
				this.keepValue = this.value;
				this.focus();
				if(this.select)
					this.select();
			}
			text.onclick = function()
			{
				if(!this.__readOnly && this.keepValue==null)
				{
					this.edit();
				}
				var box = this.parentNode;
				var row = box.getRow();
				if(listNode.onItemClick)
					listNode.onItemClick(row,box.getCol());
				return true;
			}
			text.onmousemove = function(e)
			{
				if(moveStartFlag)
				{
					moveStartFlag = false;
					if(listNode.onItemMove)
					{
						var box = this.parentNode;
						var row = box.getRow();
						var col = box.getCol();
						listNode.onItemMove(row,col);
					}
				}
			}
			text.readOnly = true;
			with(text.style)
			{
				height = '100%';
				width = '100%';
				backgroundColor = 'transparent';
				borderStyle = 'none';
				margin = 0;
				padding = 0;
			}
			return text;
		}

		//フラグ設定
		var sortEnable = false;
		var sort = false;
		var listNode = AFL.createWindow();
		var fieldsHeader = new Array();
		//色の初期設定
		var selectTextColor = 'white';
		var selectBackColor = 'blue';

		//ヘッダー領域の作成
		var header = AFL.createWindow();
		header.setChildStyle('TOP');
		listNode.addChild(header);
		header.style.backgroundColor = 'silver';
		var resizeFlag = false;
		function onHeaderSize()
		{
			var width = 0;
			for(var i=0;fieldsHeader[i];i++)
				width += fieldsHeader[i].__width;
			if(this.__width < width)
			{
				this.setSize(width,this.__height);
			}
			header.style.left = -data.scrollLeft + 'px';
			header.style.width = header.__width + data.scrollLeft + 'px';
		}
		header.onSize.push(onHeaderSize);

		var textColor = 'black';
		var backColor = 'white';

		//データ領域の作成
		var data = AFL.createWindow();
		data.setChildStyle('CLIENT');
		listNode.addChild(data);
		data.style.overflow = 'auto';
		data.style.backgroundColor = 'white';
		
		
		function onDataSize()
		{
			var childs = this.__childNodes;
			var height = this.__height;
			for(var index in childs)
			{
				//childs[index].setHeight(height);
			}
		}
		data.onSize.push(onDataSize);
		//ヘッダーデフォルトサイズ
		header.setSize(24,24);
		//ソートの許可
		listNode.setSortEnable = function(flag)
		{
			sortEnable = flag;
		}
		//アイテムの全削除
		listNode.clearItem = function()
		{
			while(this.getItemCount())
				this.delItem(0);
		}
		//リストの入れ替え
		listNode.changeItem = function(item1,item2)
		{
			var index1,index2;
			if(item1 < 0 || item2 < 0)
				return false;
			if(item1 < item2)
			{
				index1 = item1;
				index2 = item2;
			}
			else
			{
				index1 = item2;
				index2 = item1;
			}
		
			for(var i=0;fieldsHeader[i];i++)
			{
				var dnode = fieldsHeader[i].__dnode;
				var box1 = dnode.childNodes[index1];
				var box2 = dnode.childNodes[index2];

				if(box1 && box2)
				{
					dnode.insertBefore(box2,box1);
					dnode.insertBefore(box1,dnode.childNodes[index2].nextSibling);
				}
			}
			return true;
		}
		//データスクロール時の処理
		data.onscroll = function()
		{
			header.style.left = -this.scrollLeft + 'px';
			header.style.width = header.__width + this.scrollLeft + 'px';
		}
		//ソート用データ種別の設定
		listNode.setFieldKind = function(col,kind)
		{
			var h = fieldsHeader[col];
			if(!h)
				return false;
			h.__kind = kind;
		}
		//フィールド数の取得
		listNode.getFieldCount = function()
		{
			return fieldsHeader.length;
		}
		//フィールドサイズの取得
		listNode.getFieldWidth = function(col)
		{
			var h = fieldsHeader[col];
			if(!h)
				return false;
			return h.__width;
		
		}
		//フィールドサイズの設定
		listNode.setFieldWidth = function(col,width)
		{
			var h = fieldsHeader[col];
			if(!h)
				return false;
			if(width)
				h.setSize(width,0);
			else
			{
				var text = this.getHeaderText(col);
				var size = AFL.getFontSize(text);
				h.setSize(size.width+8,24);
			}
			layoutWindow(header);
			return true;
		}
		//最終フィールドのサイズ調整
		listNode.setFieldLast = function()
		{	
			var width = data.clientWidth;
			var fieldWidth = 0;
			for(var i=0;fieldsHeader[i+1];i++)
				fieldWidth += this.getFieldWidth(i);
			width -= fieldWidth;
			if(width > 0)
			{
				var col = this.getFieldCount() - 1;
				if(col >= 0)
					this.setFieldWidth(col,width);
			}
			layoutWindow(header);
		}
		//フィールドの追加
		listNode.addField = function(name,width)
		{
			var f = createField();
			f.setText(name);
			var col = fieldsHeader.length-1;
			for(var i=0;i<=col;i++)
			{
				fieldsHeader[i].__childPriority = col-i;
				fieldsHeader[i].__dnode.__childPriority = col-i;
			}
			this.setFieldWidth(col,width);
			return col;
		}
		//ヘッダーの文字列取得
		listNode.getHeaderText = function(col)
		{
			var header = fieldsHeader[col];
			if(header)
				return header.getText();
			return null;
		}
		//ヘッダー文字列設定
		listNode.setHeaderText = function(col,name)
		{
			var header = fieldsHeader[col];
			if(!header)
				return false;
			header.setText(name);
			return true;
		}
		//ソート
		listNode.sort = function(index,flag)
		{
			sort = flag;
			var datas = new Array();
			
			for(var col=0;fieldsHeader[col];col++)
			{
				var dnode = fieldsHeader[col].__dnode;
				var childs = dnode.childNodes;
				for(var row=childs.length-1;row>=0;row--)
				{
					if(col == 0)
						datas[row] = new Array();
					var box = childs[row];
					dnode.removeChild(box);
					datas[row].push(box);
				}
			}
			var kind = fieldsHeader[index].__kind;
			if(kind)
			{
				if(flag)
					datas.sort(function(a,b){return parseFloat (b[index].childNodes[0].getValue()) - parseFloat (a[index].childNodes[0].getValue());});
				else
					datas.sort(function(a,b){return parseFloat (a[index].childNodes[0].getValue()) - parseFloat (b[index].childNodes[0].getValue());});
			}
			else
			{
				if(flag)
				{
					datas.sort(function(a,b){return String(b[index].childNodes[0].getValue()).toUpperCase() > String(a[index].childNodes[0].getValue()).toUpperCase()?-1:1;});
				}
				else
				{
					datas.sort(function(a,b){return String(a[index].childNodes[0].getValue()).toUpperCase() > String(b[index].childNodes[0].getValue()).toUpperCase()?-1:1;});
				}
			}
			for(var col=0;fieldsHeader[col];col++)
			{
				var dnode = fieldsHeader[col].__dnode;
				var childs = dnode.childNodes;
				for(var row=0;datas[row];row++)
				{
					dnode.appendChild(datas[row][col]);
				}
			}
		}
		//アイテム数の取得
		listNode.getItemCount = function()
		{
			if(!fieldsHeader[0])
				return 0;
			var dnode = fieldsHeader[0].__dnode;
			return dnode.childNodes.length;
		}
		//該当する値を持ったアイテムを取得
		listNode.findItem = function(value)
		{
			var count = this.getItemCount();
			for(var i=0;i<count;i++)
			{
				if(this.getItemValue(i) == value)
					return i;
			}
			return -1;
		}
		//最初に選択されているアイテムを取得
		listNode.getSelectItem = function()
		{
			var count = this.getItemCount();
			for(var i=0;i<count;i++)
			{
				if(this.isSelectItem(i))
					return i;
			}
			return -1;
		}
		//最初に選択されているアイテムのデータを取得
		listNode.getSelectValue = function()
		{
			var count = this.getItemCount();
			for(var i=0;i<count;i++)
			{
				if(this.isSelectItem(i))
					return this.getItemValue(i);
			}
			return null;
		}
		//アイテムが選択されているか取得
		listNode.isSelectItem = function(row)
		{
			if(!fieldsHeader[0])
				return false;
			var count = this.getItemCount();
			if(row >= count)
				return false;
			var dnode = fieldsHeader[0].__dnode;
			return dnode.childNodes[row].__select;
		}
		//アイテムの選択
		listNode.selectItem = function(row,flag)
		{
			var count = this.getItemCount();
			if(row >= count)
				return false;
			function select(row)
			{
				var dnode = fieldsHeader[0].__dnode;
				var rnode = dnode.childNodes[row];
				if(rnode.__select != flag)
				{
					rnode.__select = flag;
					for(var i=0;fieldsHeader[i];i++)
					{
						dnode = fieldsHeader[i].__dnode;
						var box = dnode.childNodes[row];
						
						if(flag)
						{
							if(box.childNodes[0].type != 'file')
							{
								box.style.backgroundColor = selectBackColor;
								box.childNodes[0].style.color = selectTextColor;
							}
						}
						else
						{
							if(rnode.__backColor)
								box.style.backgroundColor = rnode.__backColor;
							else
								box.style.backgroundColor = backColor;
							box.childNodes[0].style.color = textColor;
						}
					}
				}
			}
			if(row >= 0)
			{
				select(row,flag);
			}
			else
			{
				if(fieldsHeader[0])
				{
					var dnode = fieldsHeader[0].__dnode;
					for(var i=dnode.childNodes.length-1;i>=0;i--)
						select(i);
				}
			}
		}
		listNode.setItemWeight = function(row,col,value)
		{
			var node = this.getItemNode(row,col);
			if(node)
			{
				node.childNodes[0].style.fontWeight = value;
			}
		}
		listNode.setItemAlign = function(row,col,value)
		{
			var node = this.getItemNode(row,col);
			if(node)
			{
				node.childNodes[0].style.textAlign = value;
			}
		}
		listNode.edit = function(row,col,flag)
		{
			var node = this.getItemNode(row,col);
			if(node)
			{
				node.childNodes[0].edit();
			}
		}
		listNode.setItemEdit = function(row,col,flag)
		{
			var node = this.getItemNode(row,col);
			if(node)
			{
				if(flag)
				{
					this.setItemType(row,col,'INPUT')
				}
				node.childNodes[0].__readOnly = !flag;
			}
		}
		listNode.setItemType = function(row,col,type)
		{
			var node = this.getItemNode(row,col);
			if(node)
			{
				var child = node.childNodes[0];
				var value = child.getValue();
				node.removeChild(child);
				var newInput = createInputNode(type);
				newInput.__readOnly = child.__readOnly;
				node.appendChild(newInput);
				node.childNodes[0].setValue(value);
			}
		}
		listNode.getItemCheck = function(row,col)
		{
			var node = this.getItemNode(row,col);
			if(node)
			{
				return node.childNodes[0].checked;
			}
		}
		listNode.setItemCheck = function(row,col,flag)
		{
			var node = this.getItemNode(row,col);
			if(node)
			{
				node.childNodes[0].checked = flag;
			}
		}
		//アイテムの追加
		var activeText = null;
		
		listNode.addItem = function(name)
		{
			var dnode;
			for(var i=0;fieldsHeader[i];i++)
			{
				dnode = fieldsHeader[i].__dnode;
				var box = document.createElement('DIV');
				box.__select = false;
				box.__col = i;
				box.getRow = function()
				{
					var dnode = fieldsHeader[this.__col].__dnode;
					var j;
					for(j=0;dnode.childNodes[j] != this;j++);
					return j;
				}
				box.getCol = function()
				{
					return this.__col;
				}
				with(box.style)
				{
					height = '18px';
					borderWidth = '1px';
					borderColor = 'white gray gray white';
					borderStyle = 'solid';
				}
				var text = createInputNode('PLAIN');
			//	var text = createInputNode();
				box.appendChild(text);
				if(i==0)
					text.setValue(name);
				dnode.appendChild(box);
			}
			if(dnode)
			{
				var height = 0;
				/*
				for(var i=0;dnode.childNodes[i];i++)
				{
					var h = dnode.childNodes[i].offsetHeight;
					if(h == 0)
						h = 20;
					height += h;
				}
				*/
				height = dnode.childNodes.length * 20;
				listNode.__height = height;
				for(var i=0;fieldsHeader[i];i++)
				{
					dnode = fieldsHeader[i].__dnode;
					dnode.setSize(dnode.__width,height+2,false);
				}
				return dnode.childNodes.length - 1;
			}
			else
				return -1;
		}
		//アイテムの削除
		listNode.delItem = function(row)
		{
			for(var i=0;fieldsHeader[i];i++)
			{
				var dnode = fieldsHeader[i].__dnode;
				var box = dnode.childNodes[row];
				if(box)
					dnode.removeChild(box);
			}
		}
		//アイテム用ノードの取得
		listNode.getItemNode = function(row,col)
		{
			var header = fieldsHeader[col];
			if(!header)
				return null;
			var box = header.__dnode.childNodes[row];
			return box;
		}
		//アイテムのテキストを取得
		listNode.getItemText = function(row,col)
		{
			var header = fieldsHeader[col];
			if(!header)
				return false;
			var box = header.__dnode.childNodes[row];
			if(!box)
				return false;
			var item = box.childNodes[0];
			return item.getValue();
		}
		//アイテムの位置を取得
		listNode.getItemRect = function(row,col)
		{
			var header = fieldsHeader[col];
			if(!header)
				return false;
			var box = header.__dnode.childNodes[row];
			if(!box)
				return false;
			var data = new Array();
			data['x'] = AFL.getAbsX(box);
			data['y'] = AFL.getAbsY(box);
			data['width'] = header.__dnode.__width;
			data['height'] = 20;
			return data;
		}
		
		//アイテムの背景色の設定
		listNode.setRowBackColor = function(row,color)
		{
			var header = fieldsHeader[0];
			if(!header)
				return false;
			var box = header.__dnode.childNodes[row];
			if(!box)
				return false;
			box.__backColor = color;
			
			for(var i=0;header = fieldsHeader[i];i++)
			{
				var box = header.__dnode.childNodes[row];
				if(!box)
					return false;
				box.style.backgroundColor = color;
			}
			return true;
		}
		
		//アイテムのテキストを設定
		listNode.setItemText = function(row,col,text)
		{
			var header = fieldsHeader[col];
			if(!header)
				return false;
			var box = header.__dnode.childNodes[row];
			if(!box)
				return false;
			var item = box.childNodes[0];
			item.setValue(text);
			return true;
		}
		listNode.setItemValue = function(row,value)
		{
			var header = fieldsHeader[0];
			if(!header)
				return false;
			var box = header.__dnode.childNodes[row];
			if(!box)
				return false;
			box.value = value;
			return true;
		}
		listNode.getItemValue = function(row)
		{
			var header = fieldsHeader[0];
			if(!header)
				return null;
			var box = header.__dnode.childNodes[row];
			if(!box)
				return null;
			return box.value;
		}
		//レイアウト再構成
		layoutWindow(listNode);
		return listNode;
	}
}
//ツリービューの作成
AFL.createTree = function()
{
	var tree = AFL.createWindow();
	tree.style.backgroundColor = 'white';
	tree.style.overflow = "auto";
	var rootItem = null;
	var selectItem = null;
	var hoverItem = null;
	//色の初期設定
	var selectTextColor = 'white';
	var selectBackColor = 'blue';
	tree.onItemSelect = function(){}
	tree.clearItem = function()
	{
		if(rootItem)
		{
			this.removeChild(rootItem);
			rootItem = null;
			selectItem = null;
		}
	}
	tree.getHoverItem = function()
	{
		return hoverItem;
	}
	tree.selectItem = function(value)
	{
		var item = this.findItem(value);
		if(item)
		{
			item.selectItem();
		}
	}
	tree.getSelectItem = function()
	{
		return selectItem;
	}
	tree.getSelectValue = function()
	{
		if(selectItem == null)
			return null;
		return selectItem.getItemValue();
	}
	tree.findItem = function(value)
	{
		if(!rootItem)
			return null;
		var item = rootItem;
		if(item.getItemValue() == value)
			return item;
		var keepItem = new Array();
		while(item)
		{
			var childNodes = item.getChilds();
			for(var i=0;childNodes[i];i++)
			{
				if(childNodes[i].getItemValue() == value)
					return childNodes[i];
				keepItem.push(childNodes[i]);
			}
			item = keepItem.pop();
		}
		return null;
	}
	tree.addItem = function(text,opened)
	{
		function createItem(text,opened)
		{
			var value = 0;
			var item = document.createElement('div');
			var backColor = 'white';
			var textColor = 'black';
			item.setTextColor = function(value)
			{
				textColor = value;
				if(!selectItem)
					tx.style.color = value;
			}
			item.setBackColor = function(value)
			{
				backColor = value;
				if(!selectItem)
					tx.style.backgroundColor = value;
			}
			item.findItem = function(value)
			{
				var childNodes = item.getChilds();
				for(var i=0;childNodes[i];i++)
				{
					if(childNodes[i].getItemValue() == value)
						return childNodes[i];
				}
				return null;
			}
			
			with(item.style)
			{
				whiteSpace = "nowrap";
				zIndex = 2;
			}
			var sw = document.createElement('span');
			sw.innerHTML = '･';
			with(sw.style)
			{
				marginRight = "0.5ex";
				cursor = 'pointer';
				fontFamily = "monospace";
			}
			item.appendChild(sw);
			var tx = document.createElement('span');
			item.appendChild(tx);
			item.__tx = tx;
			with(tx.style)
			{
				position = 'relative';
				cursor = 'default';
				backgroundColor = backColor;
				color = textColor;
			}
			tx.left = '16px';
			tx.innerHTML = text;
			tx.onmouseover = function()
			{
				hoverItem = item;
				this.style.textDecoration = 'underline';
			}
			tx.onmouseout = function()
			{
				if(hoverItem == item)
					hoverItem = null;
				this.style.textDecoration = 'none';
			}
			tx.onclick = function()
			{
				item.selectItem();
				return false;
			}
			tx.onmouseup = function()
			{
				this.__moveFlag = false;
			}
			tx.onmousedown = function()
			{
				if(tree.onItemMove)
				{
					this.__moveFlag = true;
					return false;
				}
				return true;
			}
			tx.onmousemove = function(e)
			{
				if(this.__moveFlag)
				{
					var parent = this.parentNode;
					this.__moveFlag = false;

					var w = AFL.createWindow();
					w.setSize(this.offsetWidth,this.offsetHeight+4);
					w.setPos(AFL.getAbsX(this),AFL.getAbsY(this)+this.offsetHeight);
					w.innerHTML = this.innerHTML;
					w.style.backgroundColor = '#FFFF00';
					w.setAlpha(50);
					w.treeView = this;
					w.setMoveFlag(true);
					w.onMoved = function()
					{
						this.close();
						if(tree.onItemMove)
							tree.onItemMove(item);
					}
					w.show();
					AFL.setMoveNode(w);

				}
				return true;
			}
			
			var items = document.createElement('div');
			item.appendChild(items);
			with(items.style)
			{
				display = 'none';
				marginLeft = '2ex';
			}
			item.getChilds = function()
			{
				return items.childNodes;
			}
			function showSwitch()
			{
				if(items.childNodes.length)
				{
					if(opened)
					{
						sw.innerHTML = "-";
						items.style.display = 'block';
					}
					else
					{
						sw.innerHTML = "+";
						items.style.display = 'none';
					}
				}
				else
				{
					sw.innerHTML = "･";
					items.style.display = 'none';
				}
			}
			sw.onclick = function()
			{
				opened = !opened;
				showSwitch();
				return false;
			}
			item.getItemLevel = function()
			{
				var i;
				var it =this;
				for(i = 0;it = it.getParentItem();i++);
				return i;
			}
	
			item.getParentItem = function()
			{
				if(this != rootItem)
				{
					var parent =  this.parentNode;
					if(parent)
						return parent.parentNode;
				}
				return null;
			}
			
			item.addItem = function(text,opened)
			{
				var item = createItem(text,opened);
				items.appendChild(item);
				showSwitch();
				return item;
			}
			item.delItem = function()
			{
				var parent =  this.parentNode;
				if(parent)
				{
					parent.removeChild(this);
				}
				if(this == rootItem)
					rootItem = null
			}
			item.isOpen = function()
			{
				return opened;
			}
			item.setOpen = function(flag)
			{
				if(opened != flag)
				{
					opened = flag;
					showSwitch();
				}
				var parent = this;
				while(parent = parent.getParentItem())
				{
					parent.setOpen(true);
				}
			}
			item.setItemText = function(text)
			{
				tx.innerHTML = text;
			}
			item.getItemText = function()
			{
				return tx.innerHTML;
			}
			item.getItemValue = function()
			{
				return value;
			}
			item.setItemValue = function(v)
			{
				value = v;
			}
			item.setColor = function()
			{
				tx.style.backgroundColor = backColor;
				tx.style.color = textColor;
			}
			item.selectItem = function()
			{
				this.setOpen(true);
				if(selectItem == this)
					return;
				if(selectItem)
				{
					selectItem.setColor();
				}
				selectItem = this;
				tx.style.backgroundColor = selectBackColor;
				tx.style.color = selectTextColor;
				tree.onItemSelect(this);
			}
			item.setChildIndex = function(index)
			{
				var parent = this.parentNode;
				var myIndex = this.getChildIndex();
				if(!parent)
					return;
				var childs = parent.childNodes;
				if(index >= 0 && childs[index] != null)
				{
					if(myIndex < index)
						parent.insertBefore(this,childs[index].nextSibling);
					else
						parent.insertBefore(this,childs[index]);
				}
			}
			item.getChildIndex = function()
			{
				var parent = this.parentNode;
				if(!parent)
					return 0;
				var childs = parent.childNodes;
				for(var index in childs)
				{
					if(childs[index] == this)
						return parseInt(index);
				}
				return -1;
			}
			return item;
		}
		if(rootItem == null)
		{
			rootItem = createItem(text,opened);
			this.appendChild(rootItem);
		}
		return rootItem;
	}
	return tree;
}
//パネルの作成
AFL.createPanel = function()
{
	var win = AFL.createWindow();
	win.setChildStyle('TOP');
	win.setSize(0,24);
	//クライアント領域のサイズを返す
	win.setClientMargin(2,2,4,4);
	
	var panel = document.createElement('DIV');
	win.appendChild(panel);
	
	function onSize()
	{
		var width = this.__width-2;
		var height = this.__height-2;
		if(width < 0)
			witdh = 0;
		if(height < 0)
			height = 0;
		try
		{
			panel.style.width = width + 'px';
			panel.style.height = height + 'px';
		}catch(e){}
	}
	win.onSize.push(onSize);
	
	panel.style.borderWidth = '1px';
	panel.style.borderStyle = 'solid';
	panel.style.borderColor = 'white black black white';
	panel.style.backgroundColor = "silver";
	return win;
}
AFL.createSelect = function()
{
	var node = AFL.createWindow();
	node.setSize(128,80);
	node.setScroll(true);
	with(node.style)
	{
		borderStyle = 'solid';
		borderWidth = '1px';
		backgroundColor = 'white';
		cursor = 'default';
	}
	node.onActive = function(flag)
	{
		if(!flag)
			this.close();
	}
	node.addItem = function(text,value)
	{
		var item = document.createElement('DIV');
		item.innerHTML = text;
		item.__value = value;
		this.appendChild(item);
		item.onmouseover = function()
		{
			this.style.color = 'white';
			this.style.backgroundColor = 'blue';
		}
		item.onmouseout = function()
		{
			this.style.color = 'black';
			this.style.backgroundColor = 'white';
		}
		item.onclick = function()
		{
			if(node.onItemClick)
			{
				node.onItemClick(this.__value);
			}
			node.close();
		}
	}
	return node;
}
AFL.createTab = function()
{
	var tabNode = AFL.createWindow();
	tabNode.setChildStyle("CLIENT");
	var header = AFL.createPanel();
	tabNode.addChild(header);

	tabNode._select = -1;
	tabNode._items = new Array();
	tabNode._nodes = new Array();
	tabNode.onChange = null;

	tabNode.enableItem = function(index,flag)
	{
		var item = this._items[index];
		item.__enable = flag;
		if(item)
		{
			if(!flag)
			{
				item.style.backgroundColor = "#808080";
			}
			if(this._select == index)
			{
				this.selectItem(-1);
			}
		}
	}
	tabNode.getSelectItem = function()
	{
		return this._select;
	}
	tabNode.selectItem = function(index)
	{
		if(tabNode._select < tabNode._items.length && tabNode._select != index)
		{
			var select = this._select;
			var o = tabNode._items[tabNode._select];
			var n = tabNode._items[index];
			if(n)
			{
				if(n.__enable)
				{
					n.style.backgroundColor = "#e0e0e0";
					n.style.marginTop = "3px";
					this._select = index;
				}
			}
			if(o && (index < 0 || n.__enable))
			{
				if(o.__enable)
					o.style.backgroundColor = "#d0d0d0";
				o.style.marginTop = "1px";
			}
			if(index < 0)
				this._select = -1;
				

			if(select != this._select && tabNode.onChange)
			{
				tabNode.onChange(this._select);
			}
			for(var i = 0; i < tabNode._items.length; i++)
			{
				var n = tabNode._nodes[i];
				if(n)
				{
					n.setVisible(i == this._select);
				}
			}
		}
		this.layoutWindow();
	}
	tabNode.addItem = function(name, node)
	{
		var width = 64;
		var item = AFL.createWindow();
		item.__enable = true;
		header.addChild(item);
		item.setSize(width, 0);
		//item.setBorder(2);
		item.setChildStyle("LEFT");
		item.style.backgroundColor = "#d0d0d0";
		item.style.borderWidth = '1px';
		item.style.borderStyle = 'solid';
		item.style.borderColor = 'white black black white';
		item.style.margin = "1px";
		item.style.cursor = "pointer";
		item.innerHTML = name;
		item.style.backgroundColor = "#d0d0d0";

		item._index = tabNode._items.length;
		tabNode._items.push(item);
		tabNode._nodes[item._index] = node;
		if(node)
		{
			node.setChildStyle("CLIENT");
			this.addChild(node);
			node.setVisible(true);
		}
		item.onmousedown = function()
		{
			tabNode.selectItem(this._index);
			return false;
		}
		var index = this._select;
		if(index == -1)
			index = 0;
		this._select = -1;
		this.selectItem(index);

		return item._index;
	}

	return tabNode;

}
AFL.createInputBox = function()
{
	var w = AFL.createFrameWindow();
	w.setTitle('Input');
	w.setSize(320,48);
	var text = AFL.createTextBox();
	text.setChildStyle("CLIENT");
	w.addChild(text);
	var button = AFL.createButton();
	button.setChildStyle("RIGHT");
	button.setText("設定");
	w.addChild(button);
	
	w.setButtonText = function(text)
	{
		button.setText(text);
	}
	text.onkeypress = function(e)
	{
		if(AFL.KEYMAP[13])
			w.onEnter();
	}
	button.onclick = function()
	{
		w.onEnter();
	}
	w.setText = function(value)
	{
		text.setText(value);
	}
	w.getText = function()
	{
		return text.getText();
	}
	w.onEnter = function(){}
	return w;
}
