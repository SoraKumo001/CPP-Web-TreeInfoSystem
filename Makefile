INCLUDES = -Isrc
LDFLAGS = -pthread -D__cplusplus -ldl
CPPFLAGS =  -pthread -D__cplusplus
LD = g++
CC = gcc
CPP = g++

TARGET = index.cgi
SRC = src

ZLIBSRC = \
	$(SRC)/Zlib/adler32.c \
	$(SRC)/Zlib/compress.c \
	$(SRC)/Zlib/crc32.c \
	$(SRC)/Zlib/deflate.c \
	$(SRC)/Zlib/gzio.c \
	$(SRC)/Zlib/infback.c \
	$(SRC)/Zlib/inffast.c \
	$(SRC)/Zlib/inflate.c \
	$(SRC)/Zlib/inftrees.c \
	$(SRC)/Zlib/trees.c \
	$(SRC)/Zlib/uncompr.c \
	$(SRC)/Zlib/zutil.c

SQLITESRC = $(SRC)/sqlite/sqlite3.c

CORESOURCE = \
	 $(SRC)/aflSqlite.cpp \
	 $(SRC)/aflCgi.cpp \
	 $(SRC)/aflStd.cpp \
	 $(SRC)/aflMd5.cpp \
	 $(SRC)/aflXml.cpp \
	 $(SRC)/aflSock.cpp \
	 $(SRC)/aflZip.cpp \
	 $(SRC)/aflAjax.cpp \
	 $(SRC)/aflWibs.cpp \
	 $(SRC)/aflPdf.cpp \
	 $(SRC)/main.cpp


COREOBJ = $(CORESOURCE:.cpp=.o)

SQLITEOBJ = $(SQLITESRC:.c=.o)

ZLIBOBJ = $(ZLIBSRC:.c=.o)

all:  $(TARGET)


clean:
	rm  -f $(LINUXOBJ) $(COREOBJ) $(TARGET) $(SQLITEOBJ) $(ZLIB)

.cpp.o:
	$(CPP) $(INCLUDES) $(CPPFLAGS) -c $< -o $@

.c.o:
	$(CC)  $(INCLUDES) -DOS_UNIX=1 -DHAVE_USLEEP=1 -DNDEBUG -DTHREADSAFE=0 -DSQLITE_OMIT_CURSOR -c $< -o $@

$(TARGET): $(COREOBJ) $(SQLITEOBJ) $(ZLIBOBJ)
	$(LD)  -o $@ $(COREOBJ) $(SQLITEOBJ) $(ZLIBOBJ) $(LDFLAGS)
