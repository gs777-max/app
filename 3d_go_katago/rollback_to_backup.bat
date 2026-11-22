@echo off
chcp 65001 > nul
echo ========================================================
echo   AI囲碁 — 叙事漢詩 ロールバック (前回版バックアップ復元)
echo ========================================================
echo.
echo 改修前のバックアップファイル:
echo   [index_anti_20261122_1000_BK.html] から
echo   [index.html] を復元します。
echo.
pause
copy /Y "%~dp0index_anti_20261122_1000_BK.html" "%~dp0index.html"
echo.
echo 復元が完了しました。いつでも元のバージョンに戻せます。
echo.
pause
