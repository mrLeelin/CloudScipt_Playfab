echo off & color 0A

set tsROOT=../Ts

rem Get Root folder path
set DIR= %~dp0


rem Get ts folder path
set tsDIR=%DIR%%tsROOT%

echo %tsDIR%


for /r %tsDIR%  %%i in (*.ts) do (
    tsc %%i   
)

pause
