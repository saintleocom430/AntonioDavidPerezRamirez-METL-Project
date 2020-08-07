@echo off

echo Welcome to METL Program Installation. Before Installing METL, you must make sure to install the following:
echo Java 1.8.261
echo Git 2.27
echo Node.js + npm 12.18.3
echo sbt.1.3.13

echo Press any key to install Java 1.8.261
pause
start msedge.exe https://download.oracle.com/otn/java/jdk/8u261-b12/a4634525489241b9a9e1aa73d9e118e6/jdk-8u261-windows-x64.exe?AuthParam=1596784623_479c61a3a679d4216e422506130c7454

echo Press any key to install Git 2.27
pause
start msedge.exe https://github.com/git-for-windows/git/releases/download/v2.28.0.windows.1/Git-2.28.0-64-bit.exe

echo Press any key to install Node.js + npm 12.18.3
pause
start msedge.exe https://nodejs.org/dist/v12.18.3/node-v12.18.3-x64.msi

echo Press any key to install sbt 1.3.13
pause
start msedge.exe https://piccolo.link/sbt-1.3.13.msi

echo Once you install all of the required programs. You may proceed to finalize the installation of METL by pressing any key.
pause

git clone --depth=1 https://github.com/saintleocom430/AntonioDavidPerezRamirez-METL-Project.git
mkdir \ivyHome
set IVY_HOME =\ivyHome
pause

echo Press any key to run the METL Server batch file.
pause

start METL-RunServer.bat

Exit