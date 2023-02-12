rm -r build
zip -r -FS coyo-web-extension.zip * -x "build.sh" "**/.DS_Store" "dist/" "dist/**"
mkdir build
mv coyo-web-extension.zip build/
