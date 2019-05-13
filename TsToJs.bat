echo off & color 0A

set  BuildPath=Bats\TsToJs.bat
set  MovePath=Bats\MoveJsToRoot.bat

rem Get Root folder path
set DIR= %~dp0

echo Create Start

call %DIR%%BuildPath%

echo Create Over

echo  Move Start
set DIR= %~dp0
echo %DIR%%MovePath%

call %DIR%%MovePath%

echo   Move Over


pause