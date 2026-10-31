# Private host: a Windows Job Object owns only the development child and descendants.
# Closing the handle (including host crashes) closes the whole group.
param([int]$LauncherPid, [string]$LauncherStarted)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
Add-Type -WarningAction SilentlyContinue -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class BeautyDevJob {
  [StructLayout(LayoutKind.Sequential)] struct BasicLimit { public long a,b; public uint flags; public UIntPtr min,max; public uint active; public UIntPtr affinity; public uint priority,scheduling; }
  [StructLayout(LayoutKind.Sequential)] struct IoCounters { public ulong a,b,c,d,e,f; }
  [StructLayout(LayoutKind.Sequential)] struct ExtendedLimit { public BasicLimit basic; public IoCounters io; public UIntPtr a,b,c,d; }
  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct Startup { public int cb; public string reserved,desktop,title; public uint x,y,w,h,cx,cy,fill,flags; public short show,reserved2; public IntPtr reservedPointer,input,output,error; }
  [StructLayout(LayoutKind.Sequential)] struct ProcessInfo { public IntPtr process,thread; public uint pid,tid; }
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int type,ref ExtendedLimit value,int length);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool CreateProcess(string application,StringBuilder command,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref Startup startup,out ProcessInfo process);
  [DllImport("kernel32.dll")] static extern uint ResumeThread(IntPtr thread);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr process,uint code);
  [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle,uint timeout);
  [DllImport("kernel32.dll")] static extern bool GetExitCodeProcess(IntPtr process,out uint code);
  [DllImport("kernel32.dll")] static extern IntPtr GetStdHandle(int number);
  public sealed class Group : IDisposable {
    IntPtr job,process;
    public Group(string exe,string arguments,string cwd) {
      job=CreateJobObject(IntPtr.Zero,null);
      if(job==IntPtr.Zero) throw new Exception("No se pudo crear el grupo Windows.");
      ProcessInfo p=new ProcessInfo();
      try {
        ExtendedLimit limits=new ExtendedLimit(); limits.basic.flags=0x2000;
        if(!SetInformationJobObject(job,9,ref limits,Marshal.SizeOf(typeof(ExtendedLimit)))) throw new Exception("No se pudo proteger el grupo Windows.");
        Startup s=new Startup(); s.cb=Marshal.SizeOf(typeof(Startup)); s.flags=0x100; s.input=IntPtr.Zero; s.output=GetStdHandle(-11); s.error=GetStdHandle(-12);
        // Suspend before assignment: no child can escape the job during startup.
        if(!CreateProcess(exe,new StringBuilder("\""+exe+"\" "+arguments),IntPtr.Zero,IntPtr.Zero,true,0x08000004,IntPtr.Zero,cwd,ref s,out p)) throw new Exception("No se pudo iniciar el proceso local.");
        process=p.process;
        if(!AssignProcessToJobObject(job,process)) { TerminateProcess(process,1); throw new Exception("No se pudo asignar el proceso al grupo seguro."); }
        if(ResumeThread(p.thread)==0xffffffff) { TerminateProcess(process,1); throw new Exception("No se pudo activar el grupo local."); }
      } catch { Dispose(); throw; }
      finally { if(p.thread!=IntPtr.Zero) CloseHandle(p.thread); }
    }
    public bool Running { get { return process!=IntPtr.Zero && WaitForSingleObject(process,0)==258; } }
    public int ExitCode { get { uint code; GetExitCodeProcess(process,out code); return (int)code; } }
    public void Dispose() { if(job!=IntPtr.Zero) { CloseHandle(job); job=IntPtr.Zero; } if(process!=IntPtr.Zero) { CloseHandle(process); process=IntPtr.Zero; } }
  }
}
'@
function Quote-Argument([string]$Value) {
  # Windows CommandLineToArgvW quoting, including spaces and trailing backslashes.
  '"' + (($Value -replace '(\\*)"','$1$1\"') -replace '(\\+)$','$1$1') + '"'
}
$group = $null
try {
  $command = ConvertFrom-Json -InputObject $env:BW_DEV_COMMAND
  if ($command.Count -lt 2) { throw 'Comando local inválido.' }
  $arguments = ($command[1..($command.Count-1)] | ForEach-Object { Quote-Argument $_ }) -join ' '
  $group = [BeautyDevJob+Group]::new($command[0],$arguments,$env:BW_DEV_ROOT)
  while ($group.Running) {
    $parent = Get-Process -Id $LauncherPid -ErrorAction SilentlyContinue
    if (-not $parent) { [Console]::Error.WriteLine('El lanzador terminó; cerrando su grupo Windows.'); break }
    if ($parent.StartTime.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.ffffffZ') -ne $LauncherStarted) { [Console]::Error.WriteLine('La identidad temporal del lanzador cambió; cerrando su grupo Windows.'); break }
    Start-Sleep -Milliseconds 200
  }
  if ($group.Running) { $result = 1 } else { $result = $group.ExitCode; [Console]::Error.WriteLine("El proceso principal del grupo terminó con código $result.") }
} catch {
  [Console]::Error.WriteLine('No se pudo mantener el grupo seguro de desarrollo Windows. Ningún proceso ajeno fue detenido.')
  [Console]::Error.WriteLine($_.Exception.GetBaseException().Message)
  $result = 1
} finally {
  if ($null -ne $group) { $group.Dispose() }
}
exit $result
