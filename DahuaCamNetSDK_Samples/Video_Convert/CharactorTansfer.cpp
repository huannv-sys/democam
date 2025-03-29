// stdafx.cpp : source file that includes just the standard includes
//	PlayDemo.pch will be the pre-compiled header
//	stdafx.obj will contain the pre-compiled type information

#include "stdafx.h"

#include "CharactorTansfer.h"
//gbkתUTF-8
std::string GbkToUtf8(const std::string& strGbk)//�����strGbk��GBK����
{
	//gbkתunicode
	int len = MultiByteToWideChar(CHINESE_CODE_PAGE, 0, strGbk.c_str(), -1, NULL, 0);
	wchar_t *strUnicode = new wchar_t[len];
	wmemset(strUnicode, 0, len);
	MultiByteToWideChar(CHINESE_CODE_PAGE, 0, strGbk.c_str(), -1, strUnicode, len);

	//unicodeתUTF-8
	len = WideCharToMultiByte(CP_UTF8, 0, strUnicode, -1, NULL, 0, NULL, NULL);
	char * strUtf8 = new char[len];
	WideCharToMultiByte(CP_UTF8, 0, strUnicode, -1, strUtf8, len, NULL, NULL);

	std::string strTemp(strUtf8);//��ʱ��strTemp��UTF-8����
	delete[]strUnicode;
	delete[]strUtf8;
	strUnicode = NULL;
	strUtf8 = NULL;
	return strTemp;
}

//UTF-8תgbk
std::string Utf8ToGbk(const std::string& strUtf8)//�����strUtf8��UTF-8����
{
	//UTF-8תunicode
	int len = MultiByteToWideChar(CP_UTF8, 0, strUtf8.c_str(), -1, NULL, 0);
	wchar_t * strUnicode = new wchar_t[len];//len = 2
	wmemset(strUnicode, 0, len);
	MultiByteToWideChar(CP_UTF8, 0, strUtf8.c_str(), -1, strUnicode, len);

	//unicodeתgbk
	len = WideCharToMultiByte(CHINESE_CODE_PAGE, 0, strUnicode, -1, NULL, 0, NULL, NULL);
	char *strGbk = new char[len];//len=3 ����Ϊ2������char*�����Զ�������\0
	memset(strGbk, 0, len);
	WideCharToMultiByte(CHINESE_CODE_PAGE,0, strUnicode, -1, strGbk, len, NULL, NULL);

	std::string strTemp(strGbk);//��ʱ��strTemp��GBK����
	delete[]strUnicode;
	delete[]strGbk;
	strUnicode = NULL;
	strGbk = NULL;
	return strTemp;
}

//gbkתunicode (���������û�õ�)
std::wstring GbkToUnicode(const std::string& strGbk)//����ֵ��wstring
{
	int len = MultiByteToWideChar(CHINESE_CODE_PAGE, 0, strGbk.c_str(), -1, NULL, 0);
	wchar_t *strUnicode = new wchar_t[len];
	wmemset(strUnicode, 0, len);
	MultiByteToWideChar(CHINESE_CODE_PAGE, 0, strGbk.c_str(), -1, strUnicode, len);

	std::wstring strTemp(strUnicode);//��ʱ��strTemp��Unicode����
	delete[]strUnicode;
	strUnicode = NULL;
	return strTemp;
}

//Unicodeתgbk
std::string UnicodeToGbk (const std::wstring& strUnicode)//������wstring
{
	int len = WideCharToMultiByte(CHINESE_CODE_PAGE, 0, strUnicode.c_str(), -1, NULL, 0, NULL, NULL);
	char *strGbk = new char[len];//len=3 ����Ϊ2������char*�����Զ�������\0
	memset(strGbk, 0, len);
	WideCharToMultiByte(CHINESE_CODE_PAGE,0,strUnicode.c_str(), -1, strGbk, len, NULL, NULL);
	
	std::string strTemp(strGbk);
	delete []strGbk;
	strGbk = NULL;
	return strTemp;
}
