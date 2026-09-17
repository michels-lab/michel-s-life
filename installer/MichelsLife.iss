#ifndef MyAppVersion
  #define MyAppVersion "3.0.202"
#endif
#ifndef PublishDir
  #define PublishDir "..\\artifacts\\publish"
#endif
[Setup]
AppId={{7F89006A-96B6-4B55-9151-46CB7D5953E1}
AppName=Michel's Life
AppVersion={#MyAppVersion}
AppPublisher=Michel's Life
DefaultDirName={autopf}\MichelsLife
DefaultGroupName=Michel's Life
DisableProgramGroupPage=yes
OutputDir=..\artifacts
OutputBaseFilename=MichelsLife-Setup-v{#MyAppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\MichelsLife.exe
SetupIconFile=..\src\MichelsLife\Assets\michels_life_icon.ico
PrivilegesRequiredOverridesAllowed=dialog

[Files]
Source: "{#PublishDir}\MichelsLife.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Michel's Life"; Filename: "{app}\MichelsLife.exe"
Name: "{autodesktop}\Michel's Life"; Filename: "{app}\MichelsLife.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\MichelsLife.exe"; Description: "Launch Michel's Life"; Flags: nowait postinstall skipifsilent
