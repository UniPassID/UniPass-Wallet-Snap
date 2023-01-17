# $ENV = [main, dev, prerelease]
echo "ENV = ${1}"
if [ -f bin/${1}.env ]; then
  cp bin/${1}.env .env
  vue-cli-service serve --host 0.0.0.0 --port ${2-1901}
else
  echo not find bin/${1}.env
fi