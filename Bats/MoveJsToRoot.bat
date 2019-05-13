echo off & color 0A

set tsROOT=\Ts
rem cd ..
rem Get Root folder path
set DIR=%cd%

rem Get ts folder path
set tsDIR=%DIR%%tsROOT%

echo %tsDIR%

echo Move  Start
for /r %tsDIR%  %%i in (*.js) do (

    echo Create js script. Name: %%i
    move %%i %DIR%
)
echo Move  Finished
pause

