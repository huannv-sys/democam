using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace RecordControl
{
    /// <summary>
    /// MainWindow.xaml 的交互逻辑
    /// </summary>
    public partial class MainWindow : Window
    {
        [DllImport("RealPlayDll.dll")]
        private static extern void interface_getParameters(ref parameter.dlgParameters info);
        [DllImport("RealPlayDll.dll")]
        private static extern int interface_Login();
        [DllImport("RealPlayDll.dll")]
        private static extern int interface_Logout();
        [DllImport("RealPlayDll.dll")]
        private static extern void interface_OpenRealPlay();
        [DllImport("RealPlayDll.dll")]
        private static extern void interface_StopRealPlay();
        [DllImport("RealPlayDll.dll")]
        private static extern int interface_StartRecord();
        [DllImport("RealPlayDll.dll")]
        private static extern int interface_StopRecord();
        public MainWindow()
        {
            InitializeComponent();
            this.Closing += new System.ComponentModel.CancelEventHandler(MainWindow_Closing);
        }

        private async void MW_btn_Login_Click(object sender, RoutedEventArgs e)
        {
            writeDlg2Structure(ref parameter.enDlgparameters);
            interface_getParameters(ref parameter.enDlgparameters);
            MW_btn_Login.IsEnabled = false;
            int status = await Task.Run(() => interface_Login());
            if (status == 0)
            {
                this.Dispatcher.Invoke(() =>
                {
                    MessageBox.Show("成功");
                });
            }
            else
            {
                this.Dispatcher.Invoke(() =>
                {
                    MessageBox.Show(status.ToString());
                });
            }
            MW_btn_Login.IsEnabled = true;
        }

        private void writeDlg2Structure(ref parameter.dlgParameters dst)
        {
            dst.strIP = MW_txtbx_IP.Text;
            dst.hwnd = videoPanel.Handle;
        }

        private void MW_btn_Logout_Click(object sender, RoutedEventArgs e)
        {
            int status = interface_Logout();
            if (status == 0)
            {
                MessageBox.Show("成功");
            }
            else
            {
                MessageBox.Show(status.ToString());
            }
        }

        private void MW_btn_OpenRealPlay_Click(object sender, RoutedEventArgs e)
        {
            videoPanel.Visible = true;
            MW_btn_OpenRealPlay.IsEnabled = false;
            MW_btn_StopRealPlay.IsEnabled = true;
            interface_OpenRealPlay();
        }

        private void MW_btn_StopRealPlay_Click(object sender, RoutedEventArgs e)
        {
            MW_btn_OpenRealPlay.IsEnabled = true;
            MW_btn_StopRealPlay.IsEnabled = false;
            interface_StopRealPlay();
            videoPanel.Visible = false;
        }

        private void MW_btn_Record_Click(object sender, RoutedEventArgs e)
        {
            MW_btn_Record.IsEnabled = false;
            int msg = interface_StartRecord();
            if(msg != 0)
                MessageBox.Show(msg.ToString());
            MW_btn_StopRecord.IsEnabled = true;
        }

        private async void MW_btn_StopRecord_Click(object sender, RoutedEventArgs e)
        {
            MW_btn_StopRecord.IsEnabled = false;
            int msg = interface_StopRecord();
            if(msg != 0)
                MessageBox.Show(msg.ToString());


            MW_lbl_ConvertStatus.Content = "FFmpeg converting.";
            await Task.Run(() =>
            {
                ProcessStartInfo Convert = new ProcessStartInfo();
                Convert.FileName = "ffmpeg";
                Convert.Arguments = "-y -i D://DahuaRecord/temp.dav -vcodec libx264 -crf 24 -movflags +faststart D://DahuaRecord/temp.mp4";
                Convert.RedirectStandardOutput = true;
                Convert.UseShellExecute = false;
                Convert.CreateNoWindow = false;
                using (Process process = Process.Start(Convert))
                {
                    using (StreamReader reader = process.StandardOutput)
                    {
                        string result = reader.ReadToEnd();
                        Console.Write(result);
                    }
                }
            });

            // 按照当前时间对文件重命名
            string oldFilePath = "D://DahuaRecord/temp";
            string newFileName = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            string newFilePath = System.IO.Path.Combine(System.IO.Path.GetDirectoryName(oldFilePath + ".dav"), newFileName);
            if (File.Exists(oldFilePath + ".dav"))
            {
                File.Move(oldFilePath + ".dav", newFilePath + ".dav");  // 重命名文件
                Console.WriteLine("File renamed to " + newFileName + ".dav");
            }
            if (File.Exists(oldFilePath + ".mp4"))
            {
                File.Move(oldFilePath + ".mp4", newFilePath + ".mp4");  // 重命名文件
                Console.WriteLine("File renamed to " + newFileName + ".mp4");
            }


            MW_lbl_ConvertStatus.Content = "";

            MW_btn_Record.IsEnabled = true;
        }

        void MainWindow_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            MessageBoxResult result = MessageBox.Show("确定要退出吗？", "确认退出", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (result == MessageBoxResult.No)
            {
                // 如果用户选择"No"，则取消关闭事件
                e.Cancel = true;
            }
            else
            {
                interface_StopRecord();
                interface_StopRealPlay();
                interface_Logout();
            }
        }
    }
}
