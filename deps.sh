# Setup the dev server
org="https://github.com/vortexdeveloperlabs/"

npm i

if [ ! -d dev-server ]; then
  git clone "${org}aero-dev-server.git" dev-server
fi

EXEC_NESTED_DEPS_CMD = "bash deps.sh"
if [ -z "${INSTALL_CMD}" ]; then
  INSTALL_CMD = "npm i"
  EXEC_NESTED_DEPS_CMD = "INSTALL_CMD=${INSTALL_CMD} ${execNestedDepsCmd}"
fi

&(cd dev-server && eval(installCmd) && bash deps.sh)
