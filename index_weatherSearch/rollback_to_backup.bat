@echo off
chcp 65001 > nul
echo ========================================================
echo [SmartWeather TV PRO] ロールバック・復元マネージャー
echo ========================================================
echo.
echo 復元したいバージョンを選択してください:
echo [1] 直前の状態に復元 (index_weatherSearch_777_20260910_1014_BK.html)
echo [2] 初期状態に復元 (index_weatherSearch_777_20260910_0955_BK.html)
echo [0] キャンセル
echo.
set /p choice="選択 (0-2): "

if "%choice%"=="1" (
    copy /Y "index_weatherSearch_777_20260910_1014_BK.html" "index_weatherSearch.html"
    echo [成功] 直前のバックアップ (10:14版) に復元しました。
) else if "%choice%"=="2" (
    copy /Y "index_weatherSearch_777_20260910_0955_BK.html" "index_weatherSearch.html"
    echo [成功] 初期バックアップ (09:55版) に復元しました。
) else (
    echo キャンセルしました。
)

pause
