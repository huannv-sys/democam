#include <windows.h>
#include <stdio.h>
#include "dhnetsdk.h"
#include <windows.h>

#pragma comment(lib , "dhnetsdk.lib")

typedef HWND(WINAPI* PROCGETCONSOLEWINDOW)();
PROCGETCONSOLEWINDOW pfnGetConsoleWindow = GetConsoleWindow;

static BOOL g_bNetSDKInitFlag = FALSE;
static LLONG g_lLoginHandle = 0L;
static LLONG g_lRealHandle = 0;
static char g_szDevIp[32] = "192.168.1.111 ";
static WORD g_nPort = 37777; // tcp ���Ӷ˿ڣ�����������¼�豸ҳ�� tcp �˿�����һ��
static char g_szUserName[64] = "admin";
static char g_szPasswd[64] = "admin123";
static BOOL g_saveData = FALSE;

//*********************************************************************************
// ���ûص���������
// 
// �豸���߻ص�����
// �������ڸûص������е��� SDK �ӿ�
// ͨ�� CLIENT_Init ���øûص����������豸���ֶ���ʱ��SDK ����øú���
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

// ���������ɹ��ص�����
// �������ڸûص������е��� SDK �ӿ�
// ͨ�� CLIENT_SetAutoReconnect ���øûص����������Ѷ��ߵ��豸�����ɹ�ʱ��SDK ����øú���
void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

// WINAPI���ڻص�����
// ͨ��wc.lpfnWndProc = WindowProcedure ���øûص�����
LRESULT CALLBACK WindowProcedure(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp);

//*********************************************************************************

void InitTest()
{
	// ��ʼ�� SDK
	g_bNetSDKInitFlag = CLIENT_Init(DisConnectFunc, 0);
	if (FALSE == g_bNetSDKInitFlag)
	{
		printf("Initialize client SDK fail; \n");
		return;
	}
	else
	{
		printf("Initialize client SDK done; \n");
	}

	// ��ȡ SDK �汾��Ϣ
	// �˲���Ϊ��ѡ����
	DWORD dwNetSdkVersion = CLIENT_GetSDKVersion();
	printf("NetSDK version is [%d]\n", dwNetSdkVersion);

	// ���ö��������ص��ӿڣ����ù����������ɹ��ص������󣬵��豸���ֶ��������SDK �ڲ����Զ�������������
	// �˲���Ϊ��ѡ�������������û���������
	CLIENT_SetAutoReconnect(&HaveReConnect, 0);

	// ���õ�¼��ʱʱ��ͳ��Դ���
	// �˲���Ϊ��ѡ����
	int nWaitTime = 5000; // ��¼������Ӧ��ʱʱ������Ϊ 5s
	int nTryTimes = 3; // ��¼ʱ���Խ������� 3 ��
	CLIENT_SetConnectTime(nWaitTime, nTryTimes);

	// ���ø������������NET_PARAM �� nWaittime��nConnectTryNum ��Ա�� CLIENT_SetConnectTime �ӿ����õĵ�¼�豸��ʱʱ��ͳ��Դ���������ͬ
	// �˲���Ϊ��ѡ����
	NET_PARAM stuNetParm = { 0 };
	stuNetParm.nConnectTime = 3000; // ��¼ʱ���Խ������ӵĳ�ʱʱ��
	CLIENT_SetNetworkParam(&stuNetParm);

	NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY stInparam;
	memset(&stInparam, 0, sizeof(stInparam));
	stInparam.dwSize = sizeof(stInparam);
	strncpy_s(stInparam.szIP, g_szDevIp, sizeof(stInparam.szIP) - 1);
	strncpy_s(stInparam.szPassword, g_szPasswd, sizeof(stInparam.szPassword) - 1);
	strncpy_s(stInparam.szUserName, g_szUserName, sizeof(stInparam.szUserName) - 1);
	stInparam.nPort = g_nPort;
	stInparam.emSpecCap = EM_LOGIN_SPEC_CAP_TCP;

	NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY stOutparam;
	memset(&stOutparam, 0, sizeof(stOutparam));
	stOutparam.dwSize = sizeof(stOutparam);

	while (0 == g_lLoginHandle)
	{
		// ��¼�豸
		g_lLoginHandle = CLIENT_LoginWithHighLevelSecurity(&stInparam, &stOutparam);

		if (0 == g_lLoginHandle)
		{
			// ���ݴ����룬������ dhnetsdk.h ���ҵ���Ӧ�Ľ��ͣ��˴���ӡ���� 16 ���ƣ�ͷ
			// �ļ�����ʮ���ƣ����е�ת����ע��
			// ���磺
			// #define NET_NOT_SUPPORTED_EC(23) // ��ǰ SDK δ֧�ָù��ܣ���Ӧ�Ĵ�����
			// Ϊ 0x80000017, 23 ��Ӧ�� 16 ����Ϊ 0x17
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d]Failed!Last Error[%x]\n",
				g_szDevIp, g_nPort, CLIENT_GetLastError());
		}
		else
		{
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Success\n", g_szDevIp, g_nPort);
		}
		// �û����ε�¼�豸����Ҫ��ʼ��һЩ���ݲ�������ʵ��ҵ���ܣ������¼��ȴ�һ
		// С��ʱ�䣬����ȴ�ʱ�����豸����
		Sleep(1000);
		printf("\n");
	}
}

void RunTest()
{
	// �ж��Ƿ��ʼ���ɹ�
	if (FALSE == g_bNetSDKInitFlag)
	{
		return;
	}
	// �ж��Ƿ��¼�豸
	if (0 == g_lLoginHandle)
	{
		return;
	}
	// ʵ��ʵʱԤ������ҵ��
	// ��ȡ����̨���ھ����ʵ�����̨������ʾԤ����Ӧ���ǹٷ����̵�bug���˴������˲��ִ���
	HMODULE hKernel32 = GetModuleHandle(L"kernel32");  // L���ַ���ת��Ϊ���ַ���
	// ��Kernel32�л�ȡGetConsoleWindow�ĺ�����ַ
	pfnGetConsoleWindow = (PROCGETCONSOLEWINDOW)GetProcAddress(hKernel32, "GetConsoleWindow");
	// ��ȡ����̨���
	HWND hWnd = pfnGetConsoleWindow();

	printf("User can input any key to quit during real play!\n");
	Sleep(1000);

	//****************************************************************************
	//���´������ڴ���һ����ʾԤ����UI����
	// ��ʼ��һ��������ṹ��
	WNDCLASSW wc = { 0 };

	// ������ʽ�������ڴ�С�ı䣬�ػ洰��
	wc.style = CS_HREDRAW | CS_VREDRAW;
	// ���ô�����ṹ�ʹ���ʵ��������ڴ������С��ͨ����Ϊ0
	wc.cbClsExtra = 0;
	wc.cbWndExtra = 0;
	// ���ô��ڵ�Icon
	wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
	// ���ر�׼�������
	wc.hCursor = LoadCursor(NULL, IDC_ARROW);
	// ���ô��ڱ���ɫΪϵͳĬ����ɫ
	wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
	// û�в˵�
	wc.lpszMenuName = NULL;
	// �����������
	wc.lpszClassName = L"WinAPIWindow";
	// �������ʵ�����
	wc.hInstance = NULL;
	// ���ûص�����
	wc.lpfnWndProc = WindowProcedure;

	// ��ע�ᴰ����ʧ�ܣ��˳�����
	if (!RegisterClassW(&wc))
		return;

	// ʹ�ô�����򿪴��ڣ���ȡ���
	// �б��������߿�ϵͳ�˵�����ʼ�ɼ�,λ������(100,100),��С(320,240)
	hWnd = CreateWindowW(L"WinAPIWindow", L"Window for Video Playback", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 100, 100, 320, 240, NULL, NULL, NULL, NULL);

	// ��ȡ���ھ��ʧ�� 
	if (hWnd == NULL)
		return;
	//****************************************************************************
	//����ʵʱԤ��
	int nChannelID = 0; // Ԥ��ͨ����
	DH_RealPlayType emRealPlayType = DH_RType_Realplay; // ʵʱԤ��
	g_lRealHandle = CLIENT_RealPlayEx(g_lLoginHandle, nChannelID, hWnd, emRealPlayType);
	g_saveData = CLIENT_SaveRealData(g_lRealHandle, "test.dav");

	if (0 == g_lRealHandle)
	{
		printf("CLIENT_RealPlayEx: failed! Error code: %x.\n", CLIENT_GetLastError());
	}
	if (FALSE == g_saveData)
	{
		printf("CLIENT_SaveRealData: failed! Error code: %x.\n", CLIENT_GetLastError());
	}

	MSG msg = { 0 };
	// �ȴ��û�����
	while (GetMessage(&msg, NULL, 0, 0))
	{
		// ��ȡ������Ϣ
		TranslateMessage(&msg);
		// ����Ϣ���͸��ص�����
		DispatchMessage(&msg);
	}
}

void EndTest()
{
	//printf("Input any key to quit!\n");
	//getchar();
	// �ر�Ԥ��
	if (TRUE == g_saveData)
	{
		if (FALSE == CLIENT_StopSaveRealData(g_lRealHandle))
		{
			printf("CLIENT_StopSaveRealData Failed!Last Error[%x]\n", CLIENT_GetLastError());
		}
		else
		{
			g_saveData = FALSE;
			printf("Success to CLIENT_StopSaveRealData.\n");
		}
	}
	if (0 != g_lRealHandle)
	{
		if (FALSE == CLIENT_StopRealPlayEx(g_lRealHandle))
		{
			printf("CLIENT_StopRealPlayEx Failed!Last Error[%x]\n", CLIENT_GetLastError());
		}
		else
		{
			g_lRealHandle = 0;
			printf("Success to CLIENT_StopRealPlayEx.\n");
		}
	}
	// �˳��豸
	if (0 != g_lLoginHandle)
	{
		if (FALSE == CLIENT_Logout(g_lLoginHandle))
		{
			printf("CLIENT_Logout Failed!Last Error[%x]\n", CLIENT_GetLastError());
		}
		else
		{
			g_lLoginHandle = 0;
		}
	}
	// �����ʼ����Դ
	if (TRUE == g_bNetSDKInitFlag)
	{
		CLIENT_Cleanup();
		g_bNetSDKInitFlag = FALSE;
	}
}

int main()
{
	InitTest();
	RunTest();
	EndTest();
	return 0;
}
//*********************************************************************************
// ���ûص����϶���
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser)
{
	printf("Call DisConnectFunc\n");
	printf("lLoginID[0x%x]", lLoginID);
	if (NULL != pchDVRIP)
	{
		printf("pchDVRIP[%s]\n", pchDVRIP);
	}
	printf("nDVRPort[%d]\n", nDVRPort);
	printf("dwUser[%p]\n", dwUser);
	printf("\n");
}

void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser)
{
	printf("Call HaveReConnect\n");
	printf("lLoginID[0x%x]", lLoginID);
	if (NULL != pchDVRIP)
	{
		printf("pchDVRIP[%s]\n", pchDVRIP);
	}
	printf("nDVRPort[%d]\n", nDVRPort);
	printf("dwUser[%p]\n", dwUser);
	printf("\n");
}

LRESULT CALLBACK WindowProcedure(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp)
{
	switch (msg)
	{
		// ����رհ�ť��ݻٴ���
	case WM_DESTROY:
		PostQuitMessage(0);
		break;
	default:
		return DefWindowProcW(hwnd, msg, wp, lp);
	}

	return 0;
}
