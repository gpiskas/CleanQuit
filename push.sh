APP_NAME= 
ANDROID_APP_ID=
if [ -z $1 ]; then
  . ./config_build.sh
else
  . $1
fi

adb shell am start -a android.intent.action.VIEW -c android.intent.category.DEFAULT -d http://dl.dropbox.com/u/1561311/$APP_NAME.xpi
echo "Pushed $APP_NAME.xpi to $ANDROID_APP_ID"