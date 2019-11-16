#if _MSC_VER >= 1100
#pragma once
#endif // _MSC_VER >= 1100
#ifndef __INC_AFLSTD

#include <string>
#include <map>
#include <vector>


//-----------------------------------------------------
// UNIX Windows 共通化用
#if defined(_WIN32) | defined(_WIN32_WCE)
	#ifndef _WINDOWS_
		#include <windows.h>
	#endif
	#if !defined(_WIN32_WCE)
		#include <process.h>
		#include <io.h>
		#include <fcntl.h>
	#endif
	#define setBinary(a) _setmode(_fileno(a),_O_BINARY)
	#define THANDLE HANDLE
	typedef int socklen_t;
	#define getCurrentThreadID() GetCurrentThreadId()
	#pragma warning(disable : 4996)
#else
	#include <sys/stat.h>
	#include <unistd.h>
	#include <sys/types.h>
	#include <sys/time.h>
	#include <sys/socket.h>
	#include <sys/un.h>
	#include <sys/ioctl.h>
	#include <netinet/in.h>
	#include <arpa/inet.h>
	#include <pthread.h>
	#include <unistd.h>
	#include <netdb.h>


	#define setBinary(a)
	#define Sleep(msec)	usleep(msec*1000)
	#define ZeroMemory(dest,length)	memset(dest,0,length)
	#define getCurrentThreadID() (INT)pthread_self()

	typedef struct tagRect{int left,top,right,bottom;}RECT,*LPRECT,*PRECT;
	typedef const char *LPCTSTR,*LPCSTR,*PCTSTR,*PCSTR;
	typedef const wchar_t  *LPCWSTR,*PCWSTR;
	typedef wchar_t  WCHAR;
	typedef char *LPTSTR,*LPSTR,*PTSTR,*PSTR;
	typedef unsigned long DWORD,*LPDWORD,*PDWORD;
	typedef unsigned short WORD,*PWORD,*LPWORD;
	typedef unsigned char BYTE,*PBYTE,*LPBYTE;
	typedef const unsigned char CBYTE,*PCBYTE,*LPCBYTE;
	typedef unsigned int UINT,*PUINT,*LPUINT,BOOL;
	typedef unsigned long ULONG,*PULONG,LPULONG;
	typedef unsigned short USHORT,*PUSHORT,*LPUSHORT;
	typedef char CHAR,TCHAR,*PCHAR,*LPCHAR;
	typedef unsigned char UCHAR,*PUCHAR,*LPUCHAR;
	typedef short SHORT,*PSHORT,*LPSHORT;
	typedef void *LPVOID,*PVOID;
	typedef int *PINT,INT,HANDLE;
	typedef void const* LPCVOID;
	typedef float FLOAT,*PFLOAT;
	#define THANDLE pthread_t
	
	#define TRUE 1
	#define FALSE 0

	#define SOCKET int
	#define IPPORT_SMTP 25
	#define INVALID_SOCKET  (SOCKET)(~0)
	#define SOCKET_ERROR            (-1)
	#define ioctlsocket ioctl
	#define closesocket close
	#define _fstat fstat
	#define _stat stat
	#define _fileno fileno
	#define _kbhit kbhit
	
	inline long timeGetTime()
	{
		timeval tv;
		gettimeofday(&tv,NULL);
		return tv.tv_usec;
	}

#endif
//-----------------------------------------------------
int strprintf(std::string& dest,const char *format,va_list argptr);
int strprintf(std::string& dest,const char *format, ...);
int strprintf(std::wstring& dest,const wchar_t *format,va_list argptr);
int strprintf(std::wstring& dest,const wchar_t *format, ...);
#define foreach(a,b) for(a=(b).begin();a!=(b).end();++a)
#define foreach_reverse(a,b) for(a=(b).rbegin();a!=(b).rend();++a)

namespace AFL{
class ClassDescBase
{
public:
	virtual LPVOID create() = 0;
};

template<class T>
class ClassDescripter : public ClassDescBase
{
public:
	LPVOID create()
	{
		return (LPVOID)new T();
	}
};

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// SP
// シェアードポインタ擬き
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

template<class T> class SP
{
public:
	SP()
	{
		m_object = NULL;
		m_count = NULL;
	}
	SP(T* object)
	{
		m_object = NULL;
		m_count = NULL;
		set(object);
	}
	SP(T& object)
	{
		m_count = NULL;
		m_object = &object;
	}
	SP(const SP& sp)
	{
		m_object = NULL;
		m_count = NULL;
		if(sp.m_object)
		{
			m_object = sp.m_object;
			m_count = sp.m_count;
			if(m_count)
				++*m_count;
		}

	}
	SP& operator=(const SP& sp)
	{
		release();
		if(sp.m_object)
		{
			m_object = sp.m_object;
			m_count = sp.m_count;
			if(m_count)
				++*m_count;
		}
		return *this;
	}
	bool operator==(const SP& sp) const
	{
		return m_object == sp.m_object;
	}
	void set(T* object)
	{
		release();
		if(object)
		{
			m_object = object;
			m_count = new int;
			*m_count = 1;
		}
	}
	T* get() const
	{
		return m_object;
	}
	T* operator->() const
	{
		return m_object;
	}
	~SP()
	{
		release();
	}

	bool operator!=(const SP& sp) const
	{
		return m_object == sp.m_object;
	}
	bool operator<=(const SP& sp) const
	{
		return m_object == sp.m_object;
	}
	bool operator<(const SP& sp) const
	{
		return *m_object < *sp.m_object;
	}
	bool operator>=(const SP& sp) const
	{
		return m_object == sp.m_object;
	}
	bool operator>(const SP& sp) const
	{
		return *m_object < *sp.m_object;
	}
protected:
	void release()
	{
		if(m_object)
		{
			if(m_count && !--*m_count)
			{
				delete m_object;
				delete m_count;
				m_object = NULL;
				m_count = NULL;
			}
		}
	}

	T* m_object;
	int* m_count;
};

//文字コード変換
void AtoB64(std::string& dest,LPCSTR src);
void EUCtoSJIS(std::string& dest,std::string& src);
void EUCtoSJIS(std::string& dest,const char* src);
void UTF8toUCS2(std::wstring& dest,LPCSTR src);
void UCS2toUTF8(std::string& dest,LPCWSTR src);
void SJIStoUTF8(std::string& dest,LPCSTR src);
void UTF8toSJIS(std::string& dest,LPCSTR src);
void EUCtoUTF8(std::string& dest,LPCSTR src);



//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// String
// 文字列制御用
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


class String : public std::string
{
public:
	operator LPCSTR()const{return c_str();}
	String(){}
	String(LPCSTR value) : std::string(value){}
	String(INT value);
	String(FLOAT value);
	String& operator=(LPCWSTR value);
	String& operator=(LPCSTR value);
	String& operator=(INT value);
	String& operator=(FLOAT value);
	INT vprintf(LPCSTR format,va_list argptr);
	INT printf(LPCSTR format, ...);
	INT appendf(LPCSTR format, ...);
	INT toInt() const;
	FLOAT toFloat() const;
	void toUpper() const;

};

class StrPrint : public String
{
public:
	StrPrint(LPCSTR format, ...);
};

class WString : public std::wstring
{
public:
	operator LPCWSTR()const{return c_str();}
	WString(){}
	WString(LPCSTR value);
	WString(LPCWSTR value) : std::wstring(value){}
	WString(INT value);
	WString(FLOAT value);
	WString& operator=(LPCWSTR value);
	WString& operator=(LPCSTR value);
	WString& operator=(INT value);
	WString& operator=(FLOAT value);
	INT vprintf(LPCWSTR format,va_list argptr);
	INT printf(LPCWSTR format, ...);
	INT appendf(LPCWSTR format, ...);
	INT toInt() const;
	FLOAT toFloat() const;
	void toUpper() const;

};

#define UCS2(a) ((LPCWSTR)Ucs2(a))
class Ucs2
{
public:
	Ucs2(LPCSTR src);
	operator LPCWSTR() const;
protected:
	WString m_string;
};
#define UTF8(a) ((LPCSTR)Utf8(a))
class Utf8
{
public:
	Utf8(LPCSTR src);
	operator LPCSTR() const;
protected:
	String m_string;
};
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// BinaryStream
// バイナリーストリーム
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
class BinaryStream
{
public:
	void load(LPCSTR fileName);
	void write(LPCVOID addr,size_t size);
	void write(LPCSTR addr);
	LPVOID getData();
	INT getSize()const;
	INT printf(LPCSTR format, ...);
protected:
	std::vector<BYTE> m_stream;
};
//文字コード判別
#define isSJIS(a) ((unsigned char)a >= 0x81 && (unsigned char)a <= 0x9f || (unsigned char)a >= 0xe0 && (unsigned char)a<=0xfc)
#define isSJIS2(a) ((unsigned char)a >= 0x40 && (unsigned char)a <= 0x7e || (unsigned char)a >= 0x80 && (unsigned char)a<=0xfc)
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// AflTClassProc
// クラス関数コールバック用関数テンプレート
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
template<class T,class ARGTYPE,DWORD (T::*function)(ARGTYPE)>
class TProc
{
public:
	static DWORD proc(LPVOID pclass,LPVOID pvoid)
	{
		return ((T*)pclass->*function)((ARGTYPE)pvoid);
	}
	static LPVOID getAdr(){return (LPVOID)&TProc::proc;}
};
#define PROC(a) (::AFL::ClassProc(a))
#if defined(_WIN32) | defined(_WIN32_WCE)
	#define CLASSPROC(a,b,c) (::AFL::ClassProc(a,::AFL::TProc<b,LPVOID,(DWORD (b::*)(LPVOID))&b::c>::getAdr()))
#else
	#define CLASSPROC(a,b,c) (::AFL::ClassProc(a,::AFL::TProc<b,LPVOID,&b::c>::getAdr()))
#endif
#define CLASSPROC2(a,b,c,d) (::AFL::ClassProc(a,::AFL::TProc<b,d,&b::c>::getAdr()))


//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// AflCall
// クラス関数呼び出し補助クラス
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
class ClassProc
{
public:
	ClassProc();
	ClassProc(LPVOID pclass,LPVOID function);
	ClassProc(LPVOID function);
	DWORD call(LPVOID pvoid=NULL);
    bool isAddress()const;

	bool operator==(const ClassProc& classProc) const
	{
		if(m_function == classProc.m_function && m_pClass == classProc.m_pClass)
			return true;
		return false;
	}
protected:
	LPVOID m_function;
	LPVOID m_pClass;
};



//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// ClassCallBack
// クラス関数コールバック用基本クラス
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
typedef class ClassCallBack AFLCLASSCALLBACK,*PAFLCLASSCALLBACK,*LPAFLCLASSCALLBACK;
class ClassCallBack
{
public:
	virtual ~ClassCallBack(){}
	virtual DWORD callProcess(LPVOID pvData) = 0;
};

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// ClassCallBack
// クラス関数コールバック用派生テンプレート
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
template<class T> class TClassCallBack : public ClassCallBack
{
public:
	TClassCallBack();
	virtual ~TClassCallBack(){}
	TClassCallBack(T* pClass,DWORD (T::*pAddress)(LPVOID));
	void setAddress(T* pClass,DWORD (T::*pAddress)(LPVOID));
	DWORD callProcess(LPVOID pvData);
	bool isAddress()const{return m_pClass && m_pAddress;}
private:
	T* m_pClass;
	DWORD (T::*m_pAddress)(LPVOID);
};

template<class T> TClassCallBack<T>::TClassCallBack()
{
	m_pClass = NULL;
	m_pAddress = NULL;
}
template<class T> TClassCallBack<T>::TClassCallBack(T* pClass,DWORD (T::*pAddress)(LPVOID))
{
	m_pClass = pClass;
	m_pAddress = pAddress;
}
template<class T> void TClassCallBack<T>::setAddress(T* pClass,DWORD (T::*pAddress)(LPVOID))
{
	m_pClass = pClass;
	m_pAddress = pAddress;
}
template<class T> DWORD TClassCallBack<T>::callProcess(LPVOID pvData)
{
	if(m_pClass && m_pAddress)
		return (m_pClass->*m_pAddress)((LPVOID)pvData);
	return 0;
}

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// aflThread
// スレッド実行用基本クラス
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
class Thread
{
public:
	static THANDLE createThread(LPVOID pAddress,LPVOID pvData,LPDWORD pdwId);
	static bool closeThread(THANDLE hThread);
	Thread();
	~Thread();
	bool closeThread();
	bool getExitCodeThread(PDWORD pdwCode=NULL);
	bool isActiveThread();
	bool startThread(ClassProc paflClassCallBack,LPVOID pvData=NULL);
	THANDLE getThreadHandle()const{return m_hThread;}
	DWORD getThreadID()const{return m_dwThreadID;}
protected:
	static DWORD threadProcServer(LPVOID pVoid);
	DWORD threadProcRouter(LPVOID pvData);

	THANDLE m_hThread;						//スレッドハンドル
	DWORD m_dwThreadID;						//スレッドID
	volatile  DWORD m_dwExitCode;			//終了コード
	volatile  bool m_bEnable;				//状態
	volatile  bool m_bStart;				//状態
	ClassProc m_paflClassCallBack;	//メンバコールバック用
};

class ThreadProc
{
	friend class Thread;
protected:
	virtual DWORD onThreadProc(LPVOID pvData){return 0;}
};
//------------------------------------------------------------
// SyncObject
// 同期制御用
//------------------------------------------------------------
class SyncObject
{
public:
	virtual ~SyncObject(){};
	virtual bool lock() = 0;
	virtual bool unlock() = 0;
};

//------------------------------------------------------------
// Critical
// 同期制御用
//------------------------------------------------------------
#ifdef _WIN32
class Critical : public SyncObject
{
public:
	Critical(){::InitializeCriticalSection(&m_Sect);}
	~Critical(){::DeleteCriticalSection(&m_Sect);}
	bool lock(){::EnterCriticalSection(&m_Sect);return TRUE;}
	bool unlock(){::LeaveCriticalSection(&m_Sect);return TRUE;}
protected:
	CRITICAL_SECTION m_Sect;
};
#else
class Critical : public SyncObject
{
public:
	Critical(){::pthread_mutex_init(&m_Sect,NULL);}
	~Critical(){::pthread_mutex_destroy(&m_Sect);}
	bool lock(){return ::pthread_mutex_lock(&m_Sect);}
	bool unlock(){return ::pthread_mutex_unlock(&m_Sect);}
protected:
	pthread_mutex_t m_Sect;
};
#endif

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// File
// ファイル制御用
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
class File
{

public:
	enum
	{
		file_binary = 0,
		file_ascii= 1,
		file_in = 2,
		file_out = 4
	};
	
	File();
	virtual ~File();
	bool open(LPCSTR fileName,LPCSTR mode="rb");
	bool close();
	INT read(LPVOID pVoid,INT iSize) const;
	INT getLength() const;
	INT tell() const;
	bool isEof() const;
	bool isOpen() const;
	void setSeek(long offset, int origin ) const;
	LPSTR gets(LPSTR pString,INT iSize);

protected:
	std::string m_strFileName;
	LPVOID m_pFileHandle;
};

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Std
// 汎用
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
class Std
{
public:
	static int GetChr(const char* pData,char Data,int nLength);
	static int GetChr(const char* pData,char Data);
	static int GetNum16(const char* pData,int nLength);
	static char* StrCnv(const char* pData,char* pString1,char* pString2);
	static char* StrCnv1(const char* pData,int nCount,char* const ppString[]);
	static LPSTR replacString(LPCSTR pData,int nCount,LPCSTR pString[]);
};

struct cmpConvert
{
	bool operator()(const String& s1,const String& s2) const
	{
		if(s1.length() > s2.length())
			return true;
		if(s1.length() == s2.length())
			return ((std::string)s1) < ((std::string)s2);
		return false;
	}
};

typedef std::map<String,String,struct cmpConvert> ConvertItem;
void replaceString(std::string& dest,LPCSTR src,ConvertItem* item);

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Debug
// デバッグ用
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
class Debug
{
public:
	static bool out(LPCSTR string, ...);
	static bool open();
	static void setLevel(INT level);

private:
	static INT m_level;
	static FILE* m_file;
};

#define UTF8TOUCS2(a) ((LPCWSTR)_UTF8toUCS2(a))
class _UTF8toUCS2
{
public:
	_UTF8toUCS2(LPCSTR src)
	{
		UTF8toUCS2(m_string,src);
	}
	operator LPCWSTR() const
	{
		return m_string.c_str();
	}
protected:
	WString m_string;
};


//namespace
}
#define __INC_AFLSTD
#endif
