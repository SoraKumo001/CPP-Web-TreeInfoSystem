//-----------------------------------------------------
#if _MSC_VER >= 1100
#pragma once
#endif // _MSC_VER >= 1100

#ifndef __INC_AFLMD5
//-----------------------------------------------------

#include "aflStd.h"
#include <string>

namespace AFL
{

class MD5
{
public:
	static bool String(std::string& dest,LPCSTR value);
	static bool File(std::string& dest,LPCSTR fileName);
	static bool File(std::string& dest,FILE* file);
};
class MD5String
{
public:
	MD5String(LPCSTR src)
	{
		MD5::String(m_string,src);
	}
	operator LPCSTR() const {return m_string.c_str();}
protected:
	String m_string;
};
#define MD5STRING(a) ((LPCSTR)MD5String(a))
}
//-----------------------------------------------------
#define __INC_AFLMD5
#endif	// __INC_AFLMD5
//-----------------------------------------------------
