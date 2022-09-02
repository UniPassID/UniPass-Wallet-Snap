# $ENV = [main, dev, prerelease]
if [ -f bin/$ENV.env ]; then
  cp bin/$ENV.env .env
  vue-cli-service serve --host localhost --port ${1-1900} --open
else
  echo not find bin/$ENV.env
fi