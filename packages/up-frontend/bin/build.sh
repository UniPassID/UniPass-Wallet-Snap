# $ENV = [main, dev, prerelease]
echo "ENV = $ENV"
if [ -f bin/$ENV.env ]; then
  cp bin/$ENV.env .env
  vue-cli-service build
else
  echo not find bin/$ENV.env
fi