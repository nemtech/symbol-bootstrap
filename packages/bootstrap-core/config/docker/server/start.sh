#!/bin/bash
set -e

function try()
{
    [[ $- = *e* ]]; SAVED_OPT_E=$?
    set +e
}

function throw()
{
    exit $1
}

function catch()
{
    export ex_code=$?
    (( $SAVED_OPT_E )) && set +e
    return $ex_code
}

catapultAppFolder=$1
dataDirectory=$2
application=$3
theOtherApplication=$4
mode=$5
name=$6
waitForOther=$7
config="./$application-config"

echo "RUNNING $application $name $mode"
export LD_LIBRARY_PATH=$catapultAppFolder/lib:$catapultAppFolder/deps

ulimit -c unlimited
umask 077

rm -f "$dataDirectory/$application.started"
rm -f "$dataDirectory/$application-recovery.started"

if [ "$mode" == "DEBUG" ]; then
  echo "Setting up core dump..."
  mkdir -p ./logs
  echo "./logs/$application.%e.%t" >/proc/sys/kernel/core_pattern
fi

otherApplicationRecoveryFile="$dataDirectory/$theOtherApplication-recovery.started"
while [ -f $otherApplicationRecoveryFile ] ;
do
    echo "Waiting for $theOtherApplication recovery to finish"
    sleep 1
done


if [ -e "$dataDirectory/$application.lock" ]; then
  echo "!!!! Have lock file present, going to run recovery in $application mode...."

  touch "$dataDirectory/$application-recovery.started"

  while [ -f "$dataDirectory/$theOtherApplication.started" ] ;
  do
    echo "Waiting for $theOtherApplication to exit"
    sleep 1
  done

  try
(
    set -e
    $catapultAppFolder/bin/catapult.recovery "$config"
    echo "!!!! Finished running recovery, should be moving on to start $application..."
)
# directly after closing the subshell you need to connect a group to the catch using ||
catch || {
    echo "!!!! $application recovery has CRASHED!"
    rm -f "$dataDirectory/$application-recovery.started"
    throw $ex_code # you can rethrow the "exception" causing the script to exit if not caught
}
fi

rm -f "$dataDirectory/$application-recovery.started"

if [ "$waitForOther" == "true" ]; then
  while [ ! -f "$dataDirectory/$theOtherApplication.started" ] ;
  do
  echo "Waiting for $theOtherApplication to start"
  sleep 1
  done
fi

touch "$dataDirectory/$application.started"

processName="catapult.$application"
echo "!!!! Starting $application...."
$catapultAppFolder/bin/$processName "$config" &
export applicationPid=$!

cleanup() {
  echo "Shutting down $application"
  kill -s SIGTERM $applicationPid
  wait $applicationPid
  exitStatus=$?
  rm -f "./data/$application.started"
  exit $exitStatus
}

#Trap SIGTERM
trap 'cleanup' SIGTERM SIGINT

while sleep 5; do
  ps aux |grep $processName |grep -q -v grep
  processStatus=$?
  if [ $processStatus -ne 0 ]; then
    echo "The process $processName has already exited."
    wait $applicationPid
    exitStatus=$?
    rm -f "./data/$application.started"
    exit $exitStatus
  fi

  if [ -e $otherApplicationRecoveryFile ]; then
    echo "Other process waiting for recovery. Shutting down $application"
    kill -s SIGTERM $applicationPid
    wait $applicationPid
    rm -f "./data/$application.started"
    exit 1
  fi
done
