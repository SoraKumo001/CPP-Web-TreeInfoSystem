#include <stdlib.h>
#include "aflWibs.h"
#include "aflPdf.h"
#include "aflXml.h"

using namespace AFL;
using namespace AFL::CGI;
using namespace AFL::SQLITE;


static const CHAR DB_PATH[] = ".wibs_data/wibs.db";

class WibsData : public WibsBase
{
public:
	bool init()
	{
		WibsBase::init();
		LPCSTR sql;
		if(!m_sqlite.isTable("tb_msg"))
		{
			sql =
				"BEGIN;"
				"CREATE TABLE tb_msg(message_id integer primary key,parent_id integer,enable integer,priority integer,type integer,kind integer,code,date,user_id integer,title_type integer,title,message);"
				"INSERT into tb_msg values(NULL,0,1,10,0,0,',',datetime('now'),0,0,'TOP MESSAGE','MESSAGE');"
				"COMMIT;";
			m_sqlite.exec(sql);
		}
		if(!m_sqlite.isTable("tb_comment"))
		{
			sql =
				"BEGIN;"
				"CREATE TABLE tb_comment(comment_id integer primary key,message_id integer,comment_enable bool,comment_date datetime,comment_name text,comment_message text);"
				"COMMIT;";
			m_sqlite.exec(sql);
		}
		return true;
	}

	WibsData(Stream* s)
	{
		m_dataDir = "wibs_data/";
		//s->setCompress(true);
		m_accessLog.init(*s,"wibs_data/wibs_log.db");
		m_stream = s;
		//m_sqlite.setDebugFile("sql.txt");
		m_sqlite.open(DB_PATH);
		m_edit = -1;

		init();
		String cmd;
		if(Method::isGET("cmd"))
			cmd = Method::GET("cmd");

		bool bot = false;
		LPCSTR agent = Method::ENV("HTTP_USER_AGENT");
		if(agent && (strstr(agent,"bot") || strstr(agent,"search")))
			bot = true;

		convert();
		if(!command())
		{
			if(bot || cmd == "html")
			{
				//ボット用プレーンHTML
				if(Method::isGET("sh"))
					outHTMLMessage();
				else
					outHTMLTopics();
			}
			else if(Method::isGET("sh"))
			{
				String loc;
				loc.printf("?#%s",Method::GET("sh"));
				m_stream->setHeader("Location",loc.c_str());
			}
			else if(cmd == "xml")
				outXML();
			else if(cmd == "pdf")
				outPDF();
			//Ajax用
			else if(cmd == "topic_list")
				outTopicList();
			else if(cmd == "message")
				outMessage();
			else if(cmd == "comment")
				outComment();
			else if(cmd == "delete_comment")
				deleteComment();
			else if(cmd == "comment_list")
				outCommentList();
			else if(cmd == "write_comment")
				writeComment();
			else if(cmd == "write_message")
				writeMessage();
			else if(cmd == "create_message")
				createMessage();
			else if(cmd == "delete_message")
				deleteMessage();
			else if(cmd == "move_topic")
				moveTopic();
			else if(cmd == "search")
				searchMessage();
			else if(cmd == "import")
				importMessage();
			else if(cmd == "edit")
				outEdit();
			else
				outMain();
		}
	}

	void importMessage()
	{
		String name;
		const MethodFile* file = Method::FILE(0,name);
		file->save("wibs_data/import.xml");

		LPCSTR methodID = Method::GET("pid");
		INT id = methodID?atoi(methodID):1;
		XML::Xml xml;
		xml.load("wibs_data/import.xml");

		m_sqlite.exec("begin;");
		writeXML(xml.get(NULL),id);
		m_sqlite.exec("commit;");
	}
	bool convert()
	{
		//if(!openDB())
		//	return false;

		SQRes res;
		if(!m_sqlite.isTable("tb_message"))
			return true;
		if(m_sqlite.isTable("tb_msg"))
			m_sqlite.exec("DROP TABLE tb_msg;");
		m_sqlite.exec(
			"CREATE TABLE tb_msg(message_id integer primary key,parent_id integer,enable integer,priority integer,type integer,kind integer,code,date,user_id integer,title_type integer,title,message);"
						"INSERT INTO tb_msg SELECT * FROM tb_message;drop table tb_message;delete from tb_mfile where parent_id=1;delete from tb_link where message_id=1;");

		m_sqlite.exec("begin;");

		SystemLink link;
		link.init(&m_sqlite);

		String sql;
		sql.printf("SELECT * FROM tb_msg");
		res = m_sqlite.exec(sql);

		ConvertItem items;
		items["\t"] = "&nbsp;&nbsp;&nbsp;&nbsp;";
		items[" "] = "&nbsp;";
		items["&"] = "&amp;";
		items["<"] = "&lt;";
		items[">"] = "&gt;";
		items["\r\n"] = "<BR>";
		items["\n"] = "<BR>";
		while(res->next())
		{
			ConvertItem convMsg = items;
			String s;
			INT mid = atoi(res->getColumnFromName("message_id"));
			INT mtype = atoi(res->getColumnFromName("kind"));
			if(mtype)
				continue;
			std::list<INT> parents;
			getParents(parents,mid);
			parents.push_back(mid);

			bool text = true;
			bool flag = false;
			String ids;
			std::list<INT>::iterator it;
			foreach(it,parents)
			{
				if(flag)
					ids.appendf(",%d",*it);
				else
				{
					ids.appendf("%d",*it);
					flag = true;
				}
			}

			String sqlLink;
			SQRes link;
			INT mRow;
			//通常リンク
			sqlLink.printf("SELECT * FROM tb_link WHERE enable=1 AND message_id IN (%s);",ids.c_str());
			link = m_sqlite.exec(sqlLink);
			for(mRow=0;mRow<link->getRows();mRow++)
			{
				LPCSTR name = link->getColumnFromName(mRow,"name");
				INT id = atoi(link->getColumnFromName(mRow,"id"));
				convMsg[name].printf("<A href='?cmd=jump&id=%d'>%s</A>",id,name);
			}
			if(mRow)
				text = false;

			//ファイルリンク
			sqlLink.printf("SELECT * FROM tb_mfile WHERE parent_id IN (%s);",ids.c_str());
			link = m_sqlite.exec(sqlLink);
			for(mRow=0;mRow<link->getRows();mRow++)
			{
				INT option1 = atoi(link->getColumnFromName(mRow,"option1"));
				LPCSTR name = link->getColumnFromName(mRow,"name");
				LPCSTR data = link->getColumnFromName(mRow,"data");
				if(option1 == 0)
					convMsg[name].printf("<A href='?cmd=file_download&id=%s'>%s</A>",data,name);
				else
				{
					String imageOption;
					std::map<String,String> option2;
					splitOption(option2,link->getColumnFromName(mRow,"option2"));
					INT width = atoi(option2["width"]);
					INT height = atoi(option2["height"]);
					if(width)
						imageOption.printf(" WIDTH='%d'",width);
					if(height)
						imageOption.printf(" HEIGHT='%d'",height);

					convMsg[name].printf("<A href='?cmd=file_download&id=%s' target='_new'><IMG border=0 src='?cmd=file_download&id=%s' alt='%s'%s></A>",
						data,data,name,imageOption.c_str());
				}
			}
			if(mRow)
				text = false;

			if(text)
			{
				sql.printf("UPDATE tb_msg SET kind=1 WHERE message_id=%d;",mid);
			}
			else
			{
				String text;
				String work;
				replaceString(work,res->getColumnFromName("message"),&convMsg);
				text += work;
				sql.printf("UPDATE tb_msg SET message='%s' WHERE message_id=%d;",SQLSTRING(text),mid);
			}
			m_sqlite.exec(sql);
		}
		m_sqlite.exec("commit;drop table tb_mfile;vaccum a;");
		return true;
	}



	void moveTopic()
	{
		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		if(!isUser())
			return;
		INT ret = 0;
		if(isUser())
		{
			LPCSTR methodID = Method::GET("id");
			LPCSTR methodPID = Method::GET("pid");
			if(methodID)
			{
				INT id = atoi(methodID);
				if(methodPID)
				{
					INT pid = atoi(methodPID);
					//親IDが配下だったら中断
					INT wid = pid;
					while(wid = getMessageParentID(wid))
					{
						if(wid == id)
							break;
					}
					//トピックの移動
					if(id>0 && pid>0 && id != pid && wid != id)
					{
						String sql;
						sql.printf("UPDATE tb_msg SET parent_id=%d WHERE message_id=%d",pid,id);
						m_sqlite.exec(sql);
						ret = 1;
					}
				}
				else if(Method::GET("up"))
				{
					INT priority = getMessagePriority(id);
					String sql;
					sql.printf("UPDATE tb_msg SET priority=%d WHERE message_id=%d;",priority-15,id);
					m_sqlite.exec(sql);
					optimizeMessage(id);
					INT priority2 = getMessagePriority(id);
					if(priority != priority2)
						ret = 1;
				}
				else if(Method::GET("down"))
				{
					INT priority = getMessagePriority(id);
					String sql;
					sql.printf("UPDATE tb_msg SET priority=%d WHERE message_id=%d;",priority+15,id);
					m_sqlite.exec(sql);
					optimizeMessage(id);
					INT priority2 = getMessagePriority(id);
					if(priority != priority2)
						ret = 1;
				}
			}
		}
		m_stream->printf("%d",ret);
	}
	void outPDFMessage(StringData& sd,INT mid,INT level=0,INT bookID=-1)
	{
		String sql;
		sql.printf("SELECT * FROM tb_msg WHERE message_id=%d AND enable=1;",mid);
		SQRes res = m_sqlite.exec(sql);

		SystemFile systemFile;
		systemFile.init(&m_sqlite);
		systemFile.setDataDir(m_dataDir);
		if(res->getRows())
		{
			INT id = atoi(res->getColumnFromName("message_id"));
			INT titleType = atoi(res->getColumnFromName("title_type"));
			INT kind = atoi(res->getColumnFromName("kind"));
			INT type = atoi(res->getColumnFromName("type"));
			LPCSTR title = res->getColumnFromName("title");
			LPCSTR message = res->getColumnFromName("message");
			sd.setMarginLeft((FLOAT)level*10+10);

			INT bookID2 = bookID;
			if(titleType <= 2)
				bookID2 = sd.setBookmark(title,bookID,type==1 || level==0);

			std::list<INT> parents;
			getParents(parents,mid);
			parents.push_back(mid);

			bool flag = false;
			String ids;
			std::list<INT>::iterator it;
			foreach(it,parents)
			{
				if(flag)
					ids.appendf(",%d",*it);
				else
				{
					ids.appendf("%d",*it);
					flag = true;
				}
			}


			if(titleType == 0)
			{
				sd.setFontSize(24.0f);
				sd.addString(title);
			}
			else if(titleType == 1)
			{
				sd.setFontSize(16.0f);
				sd.addString(title);
			}
			else if(titleType == 2)
			{
				sd.setFontSize(12.0f);
				sd.addString(title);
			}
			sd.addString("\n");
			sd.setFontSize(8.0f);
			sd.addString("\n");

			sd.setMarginLeft((FLOAT)level*10+10+35);


			std::map<std::wstring,std::wstring>::iterator itRep;
			std::map<std::wstring,std::wstring> rep;
			rep[L"&amp;"] = L"&";
			rep[L"&nbsp;"] = L" ";
			rep[L"<BR>"] = L"\n";
			rep[L"<br>"] = L"\n";



			std::wstring text;
			UTF8toUCS2(text,message);
			if(kind == 0)
			{
				INT i=0;
				LPCWSTR data = text.c_str();
				while(data[i])
				{
					bool flag = true;
					foreach(itRep,rep)
					{
						if(wcsncmp(data+i,itRep->first.c_str(),itRep->first.length())==0)
						{
							sd.addString(itRep->second.c_str());
							i += itRep->first.length();
							flag = false;
							break;
						}
					}
					if(flag)
					{
						sd.addChar(data[i]);
						i++;
					}
					/*
					//イメージリンク
					bool flag = false;
					std::map<std::wstring,String>::iterator it;
					foreach(it,file)
					{
						if(wcsstr(text.c_str()+i,it->first.c_str()) == text.c_str()+i)
						{
							sd.loadImage(it->second);
							i += (INT)it->first.length();
							flag = true;
							break;
						}
					}
					if(!flag)
					{
						sd.addChar(text[i]);
						i++;
					}
					*/
				}
			}
			else
				sd.addString(text.c_str());

			sd.addString("\n\n");

			sql.printf("SELECT message_id FROM tb_msg WHERE parent_id=%d AND enable=1 ORDER BY priority;",mid);
			SQRes res = m_sqlite.exec(sql);
			while(res->next())
			{
				outPDFMessage(sd,atoi(res->getColumn()),level+1,bookID2);
			}
		}
	}
	void outPDF()
	{
		INT id = 1;
		LPCSTR methodID = Method::GET("id");
		if(methodID)
		{
			id = atoi(methodID);
		}

		StringData sd;
		sd.setFontName(L"F1");
		outPDFMessage(sd,id,0);

		m_stream->setHeader("Content-type","application/pdf");
		BinaryStream bs;
		Pdf pdf;
		pdf.output(bs,&sd);
		//m_stream->setCompress(false);
		m_stream->setFileName("output.pdf");
		m_stream->write(bs.getData(),bs.getSize());
		//pdf.save(bs,&sd);

	}
	void writeXML(XML::Xml* xml,INT pid)
	{
		INT titleType = xml->getParamInt("title_type");
		INT kind = xml->getParamInt("kind");
		INT type = xml->getParamInt("type");
		INT enable = xml->getParamInt("enable");
		INT priority = xml->getParamInt("priority");
		LPCSTR code = xml->getParam("code");
		LPCSTR date = xml->getParam("date");
		//LPCSTR user_id = xml->getParam("user_id");
		LPCSTR title = xml->getParam("title");
		LPCSTR message = xml->getParam("message");


		String sql;
		sql.printf("INSERT INTO tb_msg values(NULL,'%d','%d','%d','%d','%d','%s','%s',%d,%d,'%s','%s');",
			pid,enable,priority,type,kind,SQLSTRING(code),SQLSTRING(date),getUserID(),titleType,SQLSTRING(title),SQLSTRING(message));
		m_sqlite.exec(sql);

		//新規IDの取得
		SQRes res = m_sqlite.exec("SELECT max(message_id) FROM tb_msg;");
		INT mid = atoi(res->getColumn());

		XML::Xml* xmlChild = NULL;
		while(xmlChild = xml->get(xmlChild))
		{
			writeXML(xmlChild,mid);
		}
		//順序の最適化
		//optimizeMessage(mid);


	}
	void outXMLMessage(XML::Xml* xmlParent,INT mid)
	{
		XML::Xml* xml = xmlParent->add("MSG");

		String sql;
		sql.printf("SELECT * FROM tb_msg WHERE message_id=%d",mid);
		SQRes res = m_sqlite.exec(sql);

		SystemFile systemFile;
		systemFile.init(&m_sqlite);
		systemFile.setDataDir(m_dataDir);
		if(res->getRows())
		{
			INT id = atoi(res->getColumnFromName("message_id"));
			INT titleType = atoi(res->getColumnFromName("title_type"));
			INT kind = atoi(res->getColumnFromName("kind"));
			INT type = atoi(res->getColumnFromName("type"));
			INT enable = atoi(res->getColumnFromName("enable"));
			INT priority = atoi(res->getColumnFromName("priority"));
			LPCSTR code = res->getColumnFromName("code");
			LPCSTR date = res->getColumnFromName("date");
			LPCSTR user_id = res->getColumnFromName("user_id");
			LPCSTR title = res->getColumnFromName("title");
			LPCSTR message = res->getColumnFromName("message");

			xml->setParam("message_id",id);
			xml->setParam("title_type",titleType);
			xml->setParam("kind",kind);
			xml->setParam("type",type);
			xml->setParam("title",title);
			xml->setParam("date",date);
			xml->setParam("user_id",user_id);
			xml->setParam("code",code);
			xml->setParam("message",message);
			xml->setParam("enable",enable);
			xml->setParam("priority",priority);

			sql.printf("SELECT message_id FROM tb_msg WHERE parent_id=%d ORDER BY priority;",mid);
			SQRes res = m_sqlite.exec(sql);
			while(res->next())
			{
				outXMLMessage(xml,atoi(res->getColumn()));
			}
		}
	}
	void outXML()
	{
		if(!isUser())
			return;

		LPCSTR methodID = Method::GET("id");
		INT id = methodID?atoi(methodID):1;

		m_stream->setFileName("out.xml");
		m_stream->setHeader("Content-type","application/octet-stream");
		XML::Xml xml;
		outXMLMessage(&xml,id);
		String s;
		xml.get(s);
		m_stream->out(s);
	}

	void optimizeMessage(INT mid)
	{
		String sql;
		sql.printf("SELECT message_id FROM tb_msg WHERE "
			"parent_id=(SELECT parent_id FROM tb_msg WHERE message_id = %d) AND "
			"type=(SELECT type FROM tb_msg WHERE message_id = %d) ORDER BY priority;",mid,mid);
		SQRes res = m_sqlite.exec(sql);
		INT i;
		for(i=0;i<res->getRows();i++)
		{
			sql.printf("UPDATE tb_msg SET priority=%d WHERE message_id=%d",
				(i+1)*10,atoi(res->getColumn(i,0)));
			m_sqlite.exec(sql);
		}
	}
	INT getMessageParentID(INT mid)
	{
		String sql;
		sql.printf("SELECT parent_id FROM tb_msg WHERE message_id='%d';",mid);
		SQRes res = m_sqlite.exec(sql);
		return atoi(res->getColumn());
	}
	INT getMessagePriority(INT mid)
	{
		String sql;
		sql.printf("SELECT priority FROM tb_msg WHERE message_id='%d';",mid);
		SQRes res = m_sqlite.exec(sql);
		return atoi(res->getColumn());
	}
	INT getMessageTreeType(INT mid)
	{
		String sql;
		sql.printf("SELECT type FROM tb_msg WHERE message_id='%d';",mid);
		SQRes res = m_sqlite.exec(sql);
		return atoi(res->getColumn());
	}
	void _deleteMessage(INT mid)
	{
		String sql;
		sql.printf("SELECT message_id FROM tb_msg WHERE parent_id='%d';",mid);
		SQRes res;
		res = m_sqlite.exec(sql);

		//子メッセージの削除
		while(res->next())
		{
			INT cid = atoi(res->getColumn());
			_deleteMessage(cid);
		}

		sql.printf("DELETE FROM tb_link WHERE message_id='%d'",mid);
		m_sqlite.exec(sql);
		sql.printf("DELETE FROM tb_mfile WHERE parent_id=%d",mid);
		m_sqlite.exec(sql);
		sql.printf("DELETE FROM tb_msg WHERE message_id=%d;",mid);
		m_sqlite.exec(sql);
	}
	void deleteMessage()
	{
		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		if(!isEdit())
		{
			m_stream->out("-1");
			return;
		}

		LPCSTR methodMid = Method::GET("message_id");
		if(!methodMid)
		{
			m_stream->out("-1");
			return;
		}
		INT mid = atoi(methodMid);
		_deleteMessage(mid);
		m_stream->out("0");
	}
	void searchMessage()
	{
		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		LPCSTR keywords = Method::GET("keyword");
		if(!keywords)
			return;
		m_accessLog.outLog("SEARCH",keywords);

		std::list<String> keys;
		INT i;
		String work;
		for(i=0;keywords[i];i++)
		{
			if(work.length() && keywords[i] == ' ')
			{
				keys.push_back(SQLSTRING(work));
				work.clear();
			}
			else
				work += keywords[i];
		}
		if(work.length())
			keys.push_back(SQLSTRING(work));
		std::list<String>::iterator itKey;
		String w;
		foreach(itKey,keys)
		{
			if(w.length())
				w.appendf("AND title like '%%%s%%' OR message like '%%%s%%'",itKey->c_str(),itKey->c_str());
			else
				w.appendf("title like '%%%s%%' OR message like '%%%s%%'",itKey->c_str(),itKey->c_str());
		}
		if(!isEdit())
			w += " AND enable=1";

		String ids;

		String sql;
		sql.printf("SELECT message_id FROM tb_msg WHERE %s;",w.c_str());
		SQRes res;
		res = m_sqlite.exec(sql);
		while(res->next())
		{
			if(isEnable(atoi(res->getColumn())))
			{
				if(ids.length())
					ids.appendf(",%s",res->getColumn());
				else
					ids = res->getColumn();
			}
		}
		sql.printf("SELECT message_id,title FROM tb_msg WHERE message_id IN (%s);",ids.c_str());
		res = m_sqlite.exec(sql);
		outRes(res);

	}
	void createMessage()
	{
		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		if(!isUser())
		{
			m_stream->out("-1");
			return;
		}
		LPCSTR methodMid = Method::GET("message_id");
		LPCSTR methodOption = Method::GET("option");
		LPCSTR methodPriority = Method::GET("priority");
		if(!methodMid ||  !methodOption)
		{
			m_stream->out("-1");
			return;
		}
		INT mid = atoi(methodMid);
		INT option = atoi(methodOption);
		INT priority = methodPriority?atoi(methodPriority):10000;

		String date;
		Time::getDateTime(date);
		INT type = 0;

		switch(option)
		{
		case 1:
			mid = getMessageParentID(mid);
			break;
		case 2:
			type = 1;
			break;
		case 3:
			type = 1;
			mid = getMessageParentID(mid);
			break;
		}
		if(mid == 0)
		{
			m_stream->out("-1");
			return;
		}

		String sql;
		sql.printf("INSERT INTO tb_msg values(NULL,'%d',0,%d,'%d',1,',','%s',%d,%d,'New Title','');",
			mid,priority,type,date.c_str(),getUserID(),type);
		m_sqlite.exec(sql);

		//新規IDの取得
		SQRes res = m_sqlite.exec("SELECT max(message_id) FROM tb_msg;");
		mid = atoi(res->getColumn());
		//順序の最適化
		optimizeMessage(mid);
		//MessageIDを戻す
		m_stream->printf("%d",mid);
	}

	void deleteComment()
	{
		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		if(!isUser())
			return;
		LPCSTR cid = Method::POST("comment_id");
		if(!cid)
			return;

		INT id = atoi(cid);
		String sql;
		sql.printf("DELETE FROM tb_comment WHERE comment_id='%d'",id);
		SQRes res = m_sqlite.exec(sql);
		m_stream->out("1");
		m_accessLog.outLog("COMMENT DELETE",id);
	}
	bool isEnable(INT id)
	{
		String sql;
		while(1)
		{
			sql.printf("SELECT parent_id FROM tb_msg WHERE message_id='%d' AND enable='1';",id);
			SQRes res = m_sqlite.exec(sql);
			if(res->getRows() == 0)
				return false;
			id = atoi(res->getColumn());
			if(id == 0)
				break;
		}
		return true;
	}
	bool isMultiCode(LPCSTR text)
	{
		WString work;
		AFL::UTF8toUCS2(work,text);
		INT i;
		LPWORD src = (LPWORD)work.c_str();
		for(i=0;src[i];i++)
		{
			if(src[i] > 0x100)
				return true;
		}
		return false;
	}

	void writeComment()
	{
		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		LPCSTR mid = Method::POST("message_id");
		LPCSTR name = Method::POST("name");
		LPCSTR message = Method::POST("message");
		if(!mid || !name || !message)
			return;
		if(*name==0 || *message==0)
		{
			m_accessLog.outLog("COMMENT ERROR 0",mid);
			m_stream->out("ERROR 未入力の項目があります ");
			return;
		}
		if(!isMultiCode(message))
		{
			m_accessLog.outLog("COMMENT ERROR A",mid);
			m_stream->out("ERROR メッセージに全角文字を含めてください");
			return;
		}
		String date;
		Time::getDateTime(date);
		INT id = atoi(mid);
		String sql;
		sql.printf("INSERT INTO tb_comment VALUES(null,'%d',1,'%s','%s','%s')",
			id,SQLSTRING(date),SQLSTRING(name),SQLSTRING(message));
		SQRes res = m_sqlite.exec(sql);
		m_stream->out("1");
		m_accessLog.outLog("COMMENT WRITE",mid);
	}
	void writeMessage()
	{
		if(!isUser())
			return;
		LPCSTR mid = Method::POST("message_id");
		LPCSTR title = Method::POST("title");
		LPCSTR mtype = Method::POST("message_type");
		LPCSTR ttype = Method::POST("title_type");
		LPCSTR trtype = Method::POST("tree_type");
		LPCSTR code = Method::POST("code");
		LPCSTR message = Method::POST("message");
		LPCSTR enable = Method::POST("enable");
		if(!mid || !title || !mtype || !ttype || !trtype || !code || !message)
			return;
		String date;
		Time::getDateTime(date);

		INT id = atoi(mid);
		String sql;
		sql.printf("UPDATE tb_msg SET enable='%d',type='%d',"
			"kind='%d',code='%s',date='%s',title_type=%d,title='%s',message='%s' WHERE message_id='%d';",
			atoi(enable),atoi(trtype),
			atoi(mtype),SQLSTRING(code),SQLSTRING(date),atoi(ttype),SQLSTRING(title),SQLSTRING(message),
			id);
		SQRes res = m_sqlite.exec(sql);
		m_stream->out("OK");
		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		optimizeMessage(id);
	}
	void outTree(INT mid,std::map<INT,std::list<INT> >& tree,std::map<INT,INT>& resID,SQRes& res)
	{
		String s;
		INT c;
		INT r = resID[mid];
		INT cols = res->getFeilds();
		for(c=0;c<cols;c++)
		{
			if(s.length())
				s += ',';
			s += TEXTSTRING(res->getColumn(r,c));
		}
		s += '\n';
		m_stream->out(s);


		std::list<INT>::iterator it;
		foreach(it,tree[mid])
		{
			outTree(*it,tree,resID,res);
		}
	}
	void outTopicList()
	{
		LPCSTR methodID = Method::GET("mid");
		if(methodID)
		{
			INT mid = atoi(methodID);
			String sql;
			if(isEdit())
				sql.printf("SELECT message_id,parent_id,enable,priority,type,kind,code,date,title_type,title FROM tb_msg WHERE message_id=%d;",mid);
			else
				sql.printf("SELECT message_id,parent_id,enable,priority,type,kind,code,date,title_type,title FROM tb_msg WHERE message_id=%d AND enable=1;",mid);
			SQRes res = m_sqlite.exec(sql);
			if(res->getRows() == 0)
				return;
			outRes(res);
			outTopicLists(atoi(res->getColumn()));

		}
		else
		{
			SQRes res;
			if(isEdit())
				res = m_sqlite.exec("SELECT message_id,parent_id,enable,priority,type,kind,code,date,title_type,title FROM tb_msg "
				"ORDER BY type desc,priority;");
			else
				res = m_sqlite.exec("SELECT message_id,parent_id,enable,priority,type,kind,code,date,title_type,title FROM tb_msg WHERE enable=1 "
				"ORDER BY type desc,priority;");
			std::map<INT,INT> resID;
			std::map<INT,std::list<INT> > tree;
			while(res->next())
			{
				INT mid = atoi(res->getColumn(0));
				INT pid = atoi(res->getColumn(1));
				resID[mid] = res->getNowColumn();
				tree[pid].push_back(mid);
			}
			outResHeader(res);
			outTree(1,tree,resID,res);
		}
	}
	void outTopicLists(INT pid)
	{
		String sql;
		if(isEdit())
			sql.printf("SELECT message_id,parent_id,enable,priority,type,kind,code,date,title_type,title FROM tb_msg WHERE parent_id=%d ORDER BY type desc,priority;",pid);
		else
			sql.printf("SELECT message_id,parent_id,enable,priority,type,kind,code,date,title_type,title FROM tb_msg WHERE parent_id=%d AND enable=1 ORDER BY type desc,priority;",pid);
		SQRes res = m_sqlite.exec(sql);
		INT rows = res->getRows();
		if(rows == 0)
			return;
		outResData(res);

		INT i;
		for(i=0;i<rows;i++)
		{
			outTopicLists(atoi(res->getColumn(i,0)));
		}
	}
	void outHTMLTopics()
	{
		m_accessLog.outLog("HTML",0);

		String sql;
		sql.printf("SELECT message_id,title FROM tb_msg WHERE type=0 AND enable=1 ORDER BY type desc,priority;");

		SQRes res = m_sqlite.exec(sql);
		INT rows = res->getRows();
		if(rows == 0)
			return;
		ConvertItem items;
		items["\t"] = "&nbsp;&nbsp;&nbsp;&nbsp;";
		items[" "] = "&nbsp;";
		items["&"] = "&amp;";
		items["<"] = "&lt;";
		items[">"] = "&gt;";
		items["\r\n"] = "<BR>";
		items["\n"] = "<BR>";

		INT i;
		m_stream->out(
			"<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">\n"
			"<HTML>\n"
			"<HEAD>\n"
			"<META http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n"
			"</HEAD>\n"
			"<BODY>\n");
		for(i=0;i<rows;i++)
		{
			INT id = atoi(res->getColumnFromName(i,"message_id"));
			String title,msg;
			replaceString(title,res->getColumnFromName(i,"title"),&items);
			m_stream->printf("<A href='?sh=%d#%d'>%s</A><BR>\n",id,id,title.c_str());
		}
		m_stream->out("</BODY>\n</HTML>\n");
	}
	INT getFrameParent(INT id)
	{
		String sql;
		if(isEdit())
			sql.printf("SELECT type,parent_id FROM tb_msg WHERE message_id='%d';",id);
		else
			sql.printf("SELECT type,parent_id FROM tb_msg WHERE message_id='%d' and enable=1;",id);
		SQRes res = m_sqlite.exec(sql);
		if(res->getRows() == 0)
			return 0;
		if(atoi(res->getColumn()) == 0)
			return id;
		INT pid = atoi(res->getColumn(1));
		if(pid == 0)
			return 0;
		return getFrameParent(pid);
	}
	void getParents(std::list<INT>& data,INT id)
	{
		INT mid = id;
		while(mid)
		{
			String sql;
			if(isEdit())
				sql.printf("SELECT parent_id FROM tb_msg WHERE message_id='%d';",mid);
			else
				sql.printf("SELECT parent_id FROM tb_msg WHERE message_id='%d' and enable=1;",mid);
			SQRes res = m_sqlite.exec(sql);
			if(res->getRows() == 0)
				break;
			mid = atoi(res->getColumn(0));
			data.push_back(mid);
		}
	}
	void outMessageData(SQRes& res)
	{
		INT r;
		INT rows = res->getRows();

		bool edit = false;
		if(Method::GET("e") && isUser())
		{
			edit = true;
		}
		ConvertItem items;
		if(!edit)
		{
			items["\t"] = "&nbsp;&nbsp;&nbsp;&nbsp;";
			items[" "] = "&nbsp;";
			items["&"] = "&amp;";
			items["<"] = "&lt;";
			items[">"] = "&gt;";
			items["\r\n"] = "<BR>";
			items["\n"] = "<BR>";
		}

		for(r=0;r<rows;r++)
		{
			ConvertItem convMsg = items;

			String s;
			INT mid = atoi(res->getColumnFromName(r,"message_id"));
			std::list<INT> parents;
			getParents(parents,mid);
			parents.push_back(mid);

			bool flag = false;
			String ids;
			std::list<INT>::iterator it;
			foreach(it,parents)
			{
				if(flag)
					ids.appendf(",%d",*it);
				else
				{
					ids.appendf("%d",*it);
					flag = true;
				}
			}

			INT titleType = atoi(res->getColumnFromName(r,"title_type"));

			String title,msg;
			replaceString(title,res->getColumnFromName(r,"title"),&items);
			//replaceString(msg,res->getColumnFromName(r,"message"),&convMsg);
			msg = res->getColumnFromName(r,"message");

			m_stream->printf("%d,%d,%d,%d,%d,%d,%s,%s,%d,%d,%s,%s,%d\n",
				mid,
				atoi(res->getColumnFromName(r,"parent_id")),
				atoi(res->getColumnFromName(r,"enable")),
				atoi(res->getColumnFromName(r,"priority")),
				atoi(res->getColumnFromName(r,"type")),
				atoi(res->getColumnFromName(r,"kind")),
				TEXTSTRING(res->getColumnFromName(r,"code")),
				TEXTSTRING(res->getColumnFromName(r,"date")),
				atoi(res->getColumnFromName(r,"user_id")),
				titleType,
				TEXTSTRING(title),
				TEXTSTRING(msg),
				atoi(res->getColumnFromName(r,"count")));
		}
	}

	void outMain()
	{
		m_accessLog.outLog("MAIN",0);
		m_stream->outFile("html/wibs.html");
	}
	void outEdit()
	{
		m_accessLog.outLog("EDIT",0);
		m_stream->outFile("html/wibs_edit.html");
	}
	void outHTMLMessage()
	{

		SQRes res;
		LPCSTR methodID = Method::GET("sh");
		INT id = 1;
		if(methodID)
			id = atoi(methodID);
		m_accessLog.outLog("HTML",id);
		String sql;
		sql.printf("SELECT * FROM tb_msg WHERE message_id='%d' and enable=1;",id);
		res = m_sqlite.exec(sql);

		INT r;
		INT rows = res->getRows();

		bool edit = false;
		ConvertItem items;
		if(!edit)
		{
			items["\t"] = "&nbsp;&nbsp;&nbsp;&nbsp;";
			items[" "] = "&nbsp;";
			items["&"] = "&amp;";
			items["<"] = "&lt;";
			items[">"] = "&gt;";
			items["\r\n"] = "<BR>";
			items["\n"] = "<BR>";
		}

		String title,msg;

		for(r=0;r<rows;r++)
		{
			ConvertItem convMsg = items;

			String s;
			INT mid = atoi(res->getColumnFromName(r,"message_id"));
			std::list<INT> parents;
			getParents(parents,mid);
			parents.push_back(mid);

			bool flag = false;
			String ids;
			std::list<INT>::iterator it;
			foreach(it,parents)
			{
				if(flag)
					ids.appendf(",%d",*it);
				else
				{
					ids.appendf("%d",*it);
					flag = true;
				}
			}
			if(!edit)
			{
				String sqlLink;
				SQRes link;
				INT mRow;
				//通常リンク
				sqlLink.printf("SELECT * FROM tb_link WHERE enable=1 AND message_id IN (%s);",ids.c_str());
				link = m_sqlite.exec(sqlLink);
				for(mRow=0;mRow<link->getRows();mRow++)
				{
					LPCSTR name = link->getColumnFromName(mRow,"name");
					INT id = atoi(link->getColumnFromName(mRow,"id"));
					convMsg[name].printf("<A href='?cmd=jump&id=%d'>%s</A>",id,name);
				}

				//ファイルリンク
				sqlLink.printf("SELECT * FROM tb_mfile WHERE parent_id IN (%s);",ids.c_str());
				link = m_sqlite.exec(sqlLink);
				for(mRow=0;mRow<link->getRows();mRow++)
				{
					INT option1 = atoi(link->getColumnFromName(mRow,"option1"));
					LPCSTR name = link->getColumnFromName(mRow,"name");
					LPCSTR data = link->getColumnFromName(mRow,"data");
					if(option1 == 0)
						convMsg[name].printf("<A href='?cmd=file_download&id=%s'>%s</A>",data,name);
					else
					{
						String imageOption;
						std::map<String,String> option2;
						splitOption(option2,link->getColumnFromName(mRow,"option2"));
						INT width = atoi(option2["width"]);
						INT height = atoi(option2["height"]);
						if(width)
							imageOption.printf(" WIDTH='%d'",width);
						if(height)
							imageOption.printf(" HEIGHT='%d'",height);

						convMsg[name].printf("<IMG src='?cmd=file_download&id=%s' alt='%s'%s>",
							data,name,imageOption.c_str());
					}
				}
			}
			replaceString(title,res->getColumnFromName(r,"title"),&items);
			replaceString(msg,res->getColumnFromName(r,"message"),&convMsg);
		}
		m_stream->printf(
			"<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">\n"
			"<HTML>\n"
			"<HEAD>\n"
			"<TITLE>%s</TITLE>\n"
			"<META http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n"
			"</HEAD>\n"
			"<BODY>\n%s\n</BODY>\n</HTML>\n",title.c_str(),msg.c_str());
	}
	void outCommentList()
	{
		SQRes res;
		LPCSTR sql =
			"select message_id,title,comment_date,comment_name,comment_message from "
			"(select message_id,comment_name,comment_date,comment_message from tb_comment where comment_date > datetime('now','-14 day') limit 20) as a "
			"join tb_msg using(message_id);";
		m_accessLog.outLog("COMMENT LIST",0);
		res = m_sqlite.exec(sql);
		outRes(res);
	}
	void outComment()
	{
		SQRes res;
		LPCSTR methodMid = Method::GET("mid");
		INT id = 0;
		if(methodMid)
			id = atoi(methodMid);
		else
			id = 0;
		String sql;
		m_accessLog.outLog("COMMENT VIEW",id);
		sql.printf("SELECT * FROM tb_comment WHERE message_id='%d' AND comment_date > datetime('now','-14 day') ORDER BY comment_date;",id);
		res = m_sqlite.exec(sql);
		outRes(res);
	}
	void outMessage()
	{
		SQRes res;
		LPCSTR methodMid = Method::GET("mid");
		LPCSTR methodT = Method::GET("t");

		m_stream->setHeader("Content-type","text/plain; charset=UTF-8");
		m_stream->out("message_id,parent_id,enable,priority,tree_type,message_type,code,date,user_id,title_type,title,message,count\n");

		if(methodMid)
		{
			INT id = atoi(methodMid);
			if(methodT)
			{
				id = getFrameParent(id);
			}

			String sql;
			if(isEdit())
			{
				m_accessLog.outLog("MESSAGE(EDIT)",id);
				sql.printf("SELECT * FROM tb_msg LEFT JOIN (SELECT message_id,count(*) as count FROM tb_comment where comment_date > datetime('now','-14 day') GROUP BY message_id) as a USING(message_id)  WHERE message_id='%d' ORDER BY priority;",id);
			}
			else
			{
				if(!isEnable(id))
				{
					m_accessLog.outLog("MESSAGE(DENY)",id);
					return;
				}
				m_accessLog.outLog("MESSAGE(VIEW)",id);
				sql.printf("SELECT * FROM tb_msg LEFT JOIN (SELECT message_id,count(*) as count FROM tb_comment where comment_date > datetime('now','-14 day') GROUP BY message_id) as a USING(message_id)  WHERE message_id='%d' and enable=1 ORDER BY priority;",id);
			}
			res = m_sqlite.exec(sql);
			outMessageData(res);
			if(methodT)
			{
				outMessageChilds(id);
			}
		}
		else
		{
			if(isEdit())
				res = m_sqlite.exec("SELECT * FROM tb_msg LEFT JOIN (SELECT message_id,count(*) as count FROM tb_comment where comment_date > datetime('now','-14 day') GROUP BY message_id) as a USING(message_id) ORDER BY priority;");
			else
				res = m_sqlite.exec("SELECT * FROM tb_msg LEFT JOIN (SELECT message_id,count(*) as count FROM tb_comment where comment_date > datetime('now','-14 day') GROUP BY message_id) as a USING(message_id) WHERE enable=1 ORDER BY priority;");
			outMessageData(res);
		}
	}
	void outMessageChilds(INT id)
	{
		String sql;
		SQRes res;
		if(isEdit())
			sql.printf("SELECT * FROM tb_msg LEFT JOIN (SELECT message_id,count(*) as count FROM tb_comment where comment_date > datetime('now','-14 day') GROUP BY message_id) as a USING(message_id) WHERE type='1' and parent_id='%d' ORDER BY priority;",id);
		else
			sql.printf("SELECT * FROM tb_msg LEFT JOIN (SELECT message_id,count(*) as count FROM tb_comment where comment_date > datetime('now','-14 day') GROUP BY message_id) as a USING(message_id) WHERE type='1' and parent_id='%d' and enable=1 ORDER BY priority;",id);
		res = m_sqlite.exec(sql);
		outMessageData(res);

		INT r;
		INT rows = res->getRows();

		for(r=0;r<rows;r++)
		{
			INT mid = atoi(res->getColumnFromName(r,"message_id"));
			outMessageChilds(mid);
		}
	}



protected:

};


class WEBServer : public HttpServer
{
	void call(Stream* s)
	{
		s->setCompress(false);
		WibsData wibs(s);
	}
};



int main()
{
	umask(0);
	setlocale(LC_ALL, "");

	if(getenv("SERVER_ADDR"))
	{
		Method::init();
		Stream s(true);
		s.setCompress(true);
		WibsData web(&s);
	}
	else
	{
		WEBServer w;
		w.start();
		getchar();
	}
	return 0;
}
