# Windows 11 native console-session and input APIs. Imported by the JEA
# module and by finite, preconfigured interactive Task Scheduler actions.
# Never expose Add-Type or this helper directly through the remote endpoint.
if (-not ('RhiMultimedia.NativeApi' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
namespace RhiMultimedia {
    public static class NativeApi {
        [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
        private struct Info1 {
            public uint SessionId;
            public int SessionState, SessionFlags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst=33)] public string Station;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst=21)] public string User;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst=18)] public string Domain;
            public long Logon, Connect, Disconnect, LastInput, Current;
            public uint IncomingBytes, OutgoingBytes, IncomingFrames, OutgoingFrames,
                        IncomingCompressedBytes, OutgoingCompressedBytes;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct InfoEx { public uint Level; public Info1 Data; }
        [DllImport("kernel32.dll")] private static extern uint WTSGetActiveConsoleSessionId();
        [DllImport("wtsapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
        private static extern bool WTSQuerySessionInformation(IntPtr server, uint session,
            int infoClass, out IntPtr buffer, out uint size);
        [DllImport("wtsapi32.dll")] private static extern void WTSFreeMemory(IntPtr buffer);
        public static uint ConsoleSession() { return WTSGetActiveConsoleSessionId(); }
        public static string Session(string account) {
            uint id = ConsoleSession();
            if (id == UInt32.MaxValue) return "none";
            IntPtr data; uint size;
            if (!WTSQuerySessionInformation(IntPtr.Zero, id, 25, out data, out size))
                return "unknown";
            try {
                if (size < Marshal.SizeOf(typeof(InfoEx))) return "unknown";
                InfoEx info = (InfoEx)Marshal.PtrToStructure(data, typeof(InfoEx));
                if (info.Level != 1 || info.Data.SessionId != id) return "unknown";
                if (String.IsNullOrEmpty(info.Data.User)) return "none";
                if (!String.Equals(info.Data.Domain + "\\" + info.Data.User, account,
                                   StringComparison.OrdinalIgnoreCase)) return "none";
                if (info.Data.SessionState != 0) return "none";
                if (info.Data.SessionFlags == 0) return "locked";
                return info.Data.SessionFlags == 1 ? "unlocked" : "unknown";
            } finally { WTSFreeMemory(data); }
        }

        [DllImport("user32.dll", SetLastError=true)]
        private static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint access);
        [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
        private static extern bool GetUserObjectInformation(IntPtr obj, int index,
            StringBuilder name, uint size, out uint needed);
        [DllImport("user32.dll")] private static extern bool CloseDesktop(IntPtr desktop);

        public static bool InteractiveDesktop(string account) {
            if (Process.GetCurrentProcess().SessionId != ConsoleSession()
                || Session(account) != "unlocked") return false;
            IntPtr desktop = OpenInputDesktop(0, false, 1);
            if (desktop == IntPtr.Zero) return false;
            try {
                StringBuilder name = new StringBuilder(128); uint needed;
                return GetUserObjectInformation(desktop, 2, name, 256, out needed)
                    && String.Equals(name.ToString(), "Default", StringComparison.OrdinalIgnoreCase);
            } finally { CloseDesktop(desktop); }
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct Mouse { public int X, Y; public uint Data, Flags, Time; public UIntPtr Extra; }
        [StructLayout(LayoutKind.Sequential)]
        private struct Keyboard { public ushort Vk, Scan; public uint Flags, Time; public UIntPtr Extra; }
        [StructLayout(LayoutKind.Explicit)]
        private struct InputUnion {
            [FieldOffset(0)] public Mouse M;
            [FieldOffset(0)] public Keyboard K;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct Input { public uint Type; public InputUnion Data; }
        [DllImport("user32.dll", SetLastError=true)]
        private static extern uint SendInput(uint count, Input[] input, int size);
        [DllImport("user32.dll", SetLastError=true)]
        private static extern IntPtr SendMessageTimeout(IntPtr hwnd, uint msg,
            UIntPtr wparam, IntPtr lparam, uint flags, uint timeout, out UIntPtr result);

        private static Input MouseInput(int x, int y, uint flags) {
            return new Input { Type=0, Data=new InputUnion {
                M=new Mouse { X=x, Y=y, Flags=flags } } };
        }
        private static Input KeyboardInput(ushort key, uint flags) {
            return new Input { Type=1, Data=new InputUnion {
                K=new Keyboard { Vk=key, Flags=flags } } };
        }
        private static bool Send(Input[] inputs) {
            return SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(Input))) == inputs.Length;
        }
        public static bool Key(string key, string account) {
            if (!InteractiveDesktop(account)) return false;
            switch (key) {
                case "MOUSE_UP": return Send(new[]{MouseInput(0,-40,1)});
                case "MOUSE_DOWN": return Send(new[]{MouseInput(0,40,1)});
                case "MOUSE_LEFT": return Send(new[]{MouseInput(-40,0,1)});
                case "MOUSE_RIGHT": return Send(new[]{MouseInput(40,0,1)});
                case "MOUSE_CLICK": return Send(new[]{MouseInput(0,0,2),MouseInput(0,0,4)});
                case "MOUSE_RIGHT_CLICK": return Send(new[]{MouseInput(0,0,8),MouseInput(0,0,16)});
                case "DISPLAY_OFF":
                    // Best-effort native monitor power request, not physical readback.
                    UIntPtr result;
                    return SendMessageTimeout(new IntPtr(0xffff), 0x112, new UIntPtr(0xf170),
                        new IntPtr(2), 2, 1000, out result) != IntPtr.Zero;
            }
            ushort vk;
            switch (key) {
                case "UP": vk=0x26; break; case "DOWN": vk=0x28; break;
                case "LEFT": vk=0x25; break; case "RIGHT": vk=0x27; break;
                case "ENTER": vk=0x0d; break; case "ESC": vk=0x1b; break;
                case "TAB": vk=9; break; case "SPACE": vk=32; break;
                case "HOME": vk=0x24; break; case "END": vk=0x23; break;
                case "PAGEUP": vk=0x21; break; case "PAGEDOWN": vk=0x22; break;
                case "BACKSPACE": vk=8; break; case "DELETE": vk=0x2e; break;
                case "PLAY_PAUSE": vk=0xb3; break; case "VOLUME_UP": vk=0xaf; break;
                case "VOLUME_DOWN": vk=0xae; break; case "MUTE": vk=0xad; break;
                default:
                    int n;
                    if (key.Length == 1 && key[0] >= '0' && key[0] <= '9') vk=(ushort)key[0];
                    else if (key.StartsWith("F") && Int32.TryParse(key.Substring(1), out n)
                             && n >= 1 && n <= 12) vk=(ushort)(0x70+n-1);
                    else return false;
                    break;
            }
            uint extended = ((vk >= 0x21 && vk <= 0x28) || vk == 0x2e ||
                             (vk >= 0xad && vk <= 0xb3)) ? 1u : 0u;
            return Send(new[]{KeyboardInput(vk, extended), KeyboardInput(vk, extended | 2u)});
        }
    }
}
'@ -ErrorAction Stop
}
