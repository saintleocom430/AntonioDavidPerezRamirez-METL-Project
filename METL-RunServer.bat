@echo off

echo Follow these instructions to setup your local METL Server.
echo 1. After you press any key, sbt will start and it will begin to setup the METL server.
echo 2. Then, once your username appears make sure to type: " container:start ".
echo 3. This begins the process. After you see success in green, the server is up and running.
echo 4. Now, to open METL head over to http://localhost:8080/ on your prefered browser.
echo Note: Make sure to never close this command prompt window while using METL or else the server will shutdown.
pause

call sbt
call container:start

pause
