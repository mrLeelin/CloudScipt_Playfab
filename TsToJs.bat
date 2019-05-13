echo off & color 0A

set js=js
set tsROOT=CloudScript_Ts

rem Get Root folder path
set DIR= %~dp0


rem Get ts folder path
set tsDIR=%DIR%%tsROOT%

echo %tsDIR%


for /r %tsDIR%  %%i in (*.ts) do (

    tsc %%i   
)

pause
echo Move  Start
for /r %tsDIR%  %%i in (*.js) do (

    echo Create js script. Name: %%i
    move %%i %DIR%

)
echo Move  Finished
pause