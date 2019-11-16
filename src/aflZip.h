//-----------------------------------------------------
#if _MSC_VER >= 1100
#pragma once
#endif // _MSC_VER >= 1100

#ifndef __INC_AFLZIP
//-----------------------------------------------------

#ifdef _WIN32
	#pragma warning( disable : 4786 )	//STL�̌x���O��
	#include <windows.h>
#endif

#include "Zlib/zlib.h"
#include "aflStd.h"
namespace AFL{
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// ZipReader
// ���k�f�[�^�ǂݍ��ݗp
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

class ZipReader
{
public:
	ZipReader();
	~ZipReader();
	bool open(LPCSTR fileName);
	bool close();
	size_t read(LPVOID data,size_t size);

protected:
	z_stream m_zstream;
	Bytef* m_buff;
	FILE* m_file;
	INT m_buffSize;
};

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// ZipWriter
// ���k�f�[�^�������ݗp
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

class ZipWriter
{
public:
	ZipWriter();
	~ZipWriter();
	bool open(LPCSTR fileName);
	bool open(BinaryStream* bs);
	bool openStd();
	bool close();
	bool write(LPCVOID data,size_t size);
protected:
	BinaryStream* m_bs;
	z_stream m_zstream;
	Bytef* m_buff;
	FILE* m_file;
	INT m_buffSize;
};

}
//-----------------------------------------------------
#define __INC_AFLZIP
#endif
//-----------------------------------------------------
