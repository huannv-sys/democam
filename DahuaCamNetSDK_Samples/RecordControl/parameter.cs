using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.RightsManagement;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace RecordControl
{
    internal class parameter
    {

        public struct dlgParameters
        {
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string strIP;
            public IntPtr hwnd;
        }
        public static dlgParameters enDlgparameters;
    }
}
