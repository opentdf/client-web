#!/usr/bin/env bash

set -x

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
ROOT_DIR="$(cd "${APP_DIR}/../../.." >/dev/null && pwd)"
WEB_APP_DIR="$(cd "${ROOT_DIR}/web-app" >/dev/null && pwd)"

app_version=$(cd "${ROOT_DIR}/lib" && node -p "require('./package.json').version")
echo "[INFO] App version: ${app_version}"

if [ $1 = backend ]; then
  VITE_PROXY='{"/api":"http://localhost:5432","/auth":"http://localhost:5432"}'
  VITE_TDF_CFG='{"oidc":{"host":"http://localhost:65432/auth/realms/tdf","clientId":"browsertest"},"kas":"http://localhost:65432/api/kas","reader":"https://secure.virtru.com/start?htmlProtocol=1"}'
else
  VITE_PROXY='{"/kas":"http://localhost:8080","/auth":"http://localhost:8888"}'
  VITE_TDF_CFG='{"oidc":{"host":"http://localhost:65432/auth/realms/opentdf","clientId":"browsertest"},"kas":"http://localhost:65432/kas","reader":"https://secure.virtru.com/start?htmlProtocol=1"}'
fi
export VITE_PROXY
export VITE_TDF_CFG

# VITE_PROXY='{"/api":"http://localhost:5432","/auth":"http://localhost:5432"}' VITE_TDF_CFG='{"oidc":{"host":"http://localhost:65432/auth/realms/tdf","clientId":"browsertest"},"kas":"http://localhost:65432/api/kas","reader":"https://secure.virtru.com/start?htmlProtocol=1"}' npm run dev

_wait_for() {
  echo "[INFO] In retry loop for quickstarted opentdf backend..."
  limit=5
  for i in $(seq 1 $limit); do
    if curl --show-error --fail --insecure "$1"; then
      return 0
    fi
    if [[ $i == "$limit" ]]; then
      echo "[WARN] Breaking _wait_for loop as we are at limit"
      break
    fi
    sleep_for=$((10 + i * i * 2))
    echo "[INFO] retrying in ${sleep_for} seconds... ( ${i} / $limit ) ..."
    sleep ${sleep_for}
  done
  echo "[ERROR] Couldn't connect to opentdf backend"
  exit 1
}

_init_webapp() {
  output=$(mktemp)
  if ! cd "${WEB_APP_DIR}"; then
    echo "[ERROR] unable to cd ${WEB_APP_DIR}"
    exit 2
  fi
  npm uninstall @opentdf/client
  if ! npm ci; then
    echo "[ERROR] Couldn't ci web-app"
    exit 2
  fi
  if ! npm i "../lib/opentdf-client-${app_version}.tgz"; then
    ls -ls ../lib/
    echo "[ERROR] Couldn't install @opentdf/client tarball"
    return 1
  fi
  npm run dev &>"$output" &
  server_pid=$!
  echo "Server pid: $server_pid"
  echo "Output: $output"
  echo "Wait:"
  limit=5
  for i in $(seq 1 $limit); do
    if grep -q -i 'ready' "$output"; then
      return 0
    fi
    if ! ps $server_pid >/dev/null; then
      echo "The server died" >&2
      cat "${output}"
      exit 1
    fi
    if [[ $i == "$limit" ]]; then
      echo "[WARN] Breaking _init_webapp loop after ${limit} iterations"
      cat "${output}"
      break
    fi
    sleep_for=$((5 + i * i * 2))
    echo "[INFO] retrying in ${sleep_for} seconds... ( ${i} / $limit ) ..."
    sleep ${sleep_for}
  done
}

_init_platform() {
  output=$(mktemp)
  if ! cd "${APP_DIR}"; then
    echo "[ERROR] unable to cd ${APP_DIR}"
    exit 2
  fi
  if ! go run github.com/opentdf/platform/service@latest provision keycloak; then
    echo "[ERROR] unable to provision keycloak"
    return 1
  fi
  if ! ./config-demo-idp.sh; then
    echo "[ERROR] unable to provision keycloak"
    return 1
  fi
  if ! ./init-temp-keys.sh; then
    echo "[ERROR] unable to initialize keys"
    return 1
  fi
  go run github.com/opentdf/platform/service@latest start &>"$output" &
  server_pid=$!
  echo "Platform pid: $server_pid"
  echo "Output: $output"
  echo "Wait:"
  limit=5
  for i in $(seq 1 $limit); do
    if grep -q -i 'starting http server' "$output"; then
      return 0
    fi
    if ! ps $server_pid >/dev/null; then
      echo "The server died" >&2
      cat "${output}"
      exit 1
    fi
    if [[ $i == "$limit" ]]; then
      echo "[WARN] Breaking _init_platform loop after ${limit} iterations"
      cat "${output}"
      break
    fi
    sleep_for=$((5 + i * i * 2))
    echo "[INFO] retrying in ${sleep_for} seconds... ( ${i} / $limit ) ..."
    sleep ${sleep_for}
  done
}

if ! _init_webapp; then
  echo "[ERROR] Couldn't run web app server"
  exit 2
fi

if [ $1 = platform ]; then
  if ! _init_platform; then
    echo "[ERROR] Couldn't run platform"
    exit 2
  fi
fi

if ! cd "${WEB_APP_DIR}"; then
  echo "[ERROR] Couldn't cd to web-app dir, [${WEB_APP_DIR}]"
  exit 2
fi

if ! cd tests; then
  echo "[ERROR] Couldn't open web integration tests folder"
  exit 2
fi

if ! npm i; then
  echo "[ERROR] Unable to install integration tests deps"
  exit 2
fi

if ! npx playwright install --with-deps; then
  echo "[ERROR] Unable to install playwright"
  exit 2
fi

npm test
