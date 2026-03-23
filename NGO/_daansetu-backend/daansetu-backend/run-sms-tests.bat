@echo off
cd /d "B:\NGO\_daansetu-backend\daansetu-backend"
call mvnw.cmd test -Dtest=SmsServiceTest -Dsurefire.useFile=false --no-transfer-progress > logs\sms-test.log 2>&1
echo EXIT_CODE=%ERRORLEVEL%>> logs\sms-test.log

