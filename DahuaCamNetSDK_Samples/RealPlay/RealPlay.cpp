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
static WORD g_nPort = 37777; // tcp 连接端口，需与期望登录设备页面 tcp 端口配置一致
static char g_szUserName[64] = "admin";
static char g_szPasswd[64] = "admin123";
static BOOL g_saveData = FALSE;

//*********************************************************************************
// 常用回调集合声明
// 
// 设备断线回调函数
// 不建议在该回调函数中调用 SDK 接口
// 通过 CLIENT_Init 设置该回调函数，当设备出现断线时，SDK 会调用该函数
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

// 断线重连成功回调函数
// 不建议在该回调函数中调用 SDK 接口
// 通过 CLIENT_SetAutoReconnect 设置该回调函数，当已断线的设备重连成功时，SDK 会调用该函数
void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

// WINAPI窗口回调函数
// 通过wc.lpfnWndProc = WindowProcedure 设置该回调函数
LRESULT CALLBACK WindowProcedure(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp);

//*********************************************************************************

void InitTest()
{
	// 初始化 SDK
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

	// 获取 SDK 版本信息
	// 此操作为可选操作
	DWORD dwNetSdkVersion = CLIENT_GetSDKVersion();
	printf("NetSDK version is [%d]\n", dwNetSdkVersion);

	// 设置断线重连回调接口，设置过断线重连成功回调函数后，当设备出现断线情况，SDK 内部会自动进行重连操作
	// 此操作为可选操作，但建议用户进行设置
	CLIENT_SetAutoReconnect(&HaveReConnect, 0);

	// 设置登录超时时间和尝试次数
	// 此操作为可选操作
	int nWaitTime = 5000; // 登录请求响应超时时间设置为 5s
	int nTryTimes = 3; // 登录时尝试建立链接 3 次
	CLIENT_SetConnectTime(nWaitTime, nTryTimes);

	// 设置更多网络参数，NET_PARAM 的 nWaittime，nConnectTryNum 成员与 CLIENT_SetConnectTime 接口设置的登录设备超时时间和尝试次数意义相同
	// 此操作为可选操作
	NET_PARAM stuNetParm = { 0 };
	stuNetParm.nConnectTime = 3000; // 登录时尝试建立链接的超时时间
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
		// 登录设备
		g_lLoginHandle = CLIENT_LoginWithHighLevelSecurity(&stInparam, &stOutparam);

		if (0 == g_lLoginHandle)
		{
			// 根据错误码，可以在 dhnetsdk.h 中找到相应的解释，此处打印的是 16 进制，头
			// 文件中是十进制，其中的转换需注意
			// 例如：
			// #define NET_NOT_SUPPORTED_EC(23) // 当前 SDK 未支持该功能，对应的错误码
			// 为 0x80000017, 23 对应的 16 进制为 0x17
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d]Failed!Last Error[%x]\n",
				g_szDevIp, g_nPort, CLIENT_GetLastError());
		}
		else
		{
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Success\n", g_szDevIp, g_nPort);
		}
		// 用户初次登录设备，需要初始化一些数据才能正常实现业务功能，建议登录后等待一
		// 小段时间，具体等待时间因设备而异
		Sleep(1000);
		printf("\n");
	}
}

void RunTest()
{
	// 判断是否初始化成功
	if (FALSE == g_bNetSDKInitFlag)
	{
		return;
	}
	// 判断是否登录设备
	if (0 == g_lLoginHandle)
	{
		return;
	}
	// 实现实时预览功能业务
	// 获取控制台窗口句柄，实测控制台不能显示预览，应该是官方例程的bug，此处保留此部分代码
	HMODULE hKernel32 = GetModuleHandle(L"kernel32");  // L将字符串转换为宽字符串
	// 从Kernel32中获取GetConsoleWindow的函数地址
	pfnGetConsoleWindow = (PROCGETCONSOLEWINDOW)GetProcAddress(hKernel32, "GetConsoleWindow");
	// 获取控制台句柄
	HWND hWnd = pfnGetConsoleWindow();

	printf("User can input any key to quit during real play!\n");
	Sleep(1000);

	//****************************************************************************
	//以下代码用于创建一个显示预览的UI界面
	// 初始化一个窗口类结构体
	WNDCLASSW wc = { 0 };

	// 窗口样式，若窗口大小改变，重绘窗口
	wc.style = CS_HREDRAW | CS_VREDRAW;
	// 设置窗口类结构和窗口实例额外的内存区域大小，通常设为0
	wc.cbClsExtra = 0;
	wc.cbWndExtra = 0;
	// 设置窗口的Icon
	wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
	// 加载标准的鼠标光标
	wc.hCursor = LoadCursor(NULL, IDC_ARROW);
	// 设置窗口背景色为系统默认颜色
	wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
	// 没有菜单
	wc.lpszMenuName = NULL;
	// 窗口类的名称
	wc.lpszClassName = L"WinAPIWindow";
	// 窗口类的实例句柄
	wc.hInstance = NULL;
	// 设置回调函数
	wc.lpfnWndProc = WindowProcedure;

	// 若注册窗口类失败，退出函数
	if (!RegisterClassW(&wc))
		return;

	// 使用窗口类打开窗口，获取句柄
	// 有标题栏、边框、系统菜单，初始可见,位置坐标(100,100),大小(320,240)
	hWnd = CreateWindowW(L"WinAPIWindow", L"Window for Video Playback", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 100, 100, 320, 240, NULL, NULL, NULL, NULL);

	// 获取窗口句柄失败 
	if (hWnd == NULL)
		return;
	//****************************************************************************
	//开启实时预览
	int nChannelID = 0; // 预览通道号
	DH_RealPlayType emRealPlayType = DH_RType_Realplay; // 实时预览
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
	// 等待用户操作
	while (GetMessage(&msg, NULL, 0, 0))
	{
		// 获取按键信息
		TranslateMessage(&msg);
		// 将信息发送给回调函数
		DispatchMessage(&msg);
	}
}

void EndTest()
{
	//printf("Input any key to quit!\n");
	//getchar();
	// 关闭预览
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
	// 退出设备
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
	// 清理初始化资源
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
// 常用回调集合定义
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
		// 点击关闭按钮后摧毁窗口
	case WM_DESTROY:
		PostQuitMessage(0);
		break;
	default:
		return DefWindowProcW(hwnd, msg, wp, lp);
	}

	return 0;
}
