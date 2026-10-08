#ifndef MyAppVersion
  #define MyAppVersion "3.0.216"
#endif
#ifndef PublishDir
  #define PublishDir "..\\artifacts\\publish"
#endif

[Setup]
AppId={{7F89006A-96B6-4B55-9151-46CB7D5953E1}
AppName=Michel's Life
AppVersion={#MyAppVersion}
AppPublisher=Michel's Lab
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

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[CustomMessages]
english.DesktopShortcut=Create a desktop shortcut
spanish.DesktopShortcut=Crear un acceso directo en el escritorio
english.AdditionalIcons=Additional icons:
spanish.AdditionalIcons=Iconos adicionales:
english.LaunchApp=Launch Michel's Life
spanish.LaunchApp=Abrir Michel's Life

[Files]
Source: "{#PublishDir}\MichelsLife.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Michel's Life"; Filename: "{app}\MichelsLife.exe"
Name: "{autodesktop}\Michel's Life"; Filename: "{app}\MichelsLife.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "{cm:DesktopShortcut}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Registry]
Root: HKCU; Subkey: "Software\Michel's Life"; ValueType: string; ValueName: "Language"; ValueData: "{language}"; Flags: uninsdeletevalue

[Run]
Filename: "{app}\MichelsLife.exe"; Description: "{cm:LaunchApp}"; Flags: nowait postinstall skipifsilent
