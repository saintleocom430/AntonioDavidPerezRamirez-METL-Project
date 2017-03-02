java -Xmx1024M -XX:MaxPermSize=128M -XX:+UseConcMarkSweepGC -XX:+CMSPermGenSweepingEnabled -XX:+CMSClassUnloadingEnabled -Dsbt.boot.directory="%IVY_HOME%\.sbt-boot" -Dsbt.global.home="%IVY_HOME%\.sbt" -Dsbt.home="%IVY_HOME%\.sbt" -Dsbt.ivy.home=%IVY_HOME%\.ivy2\ -Dsbt.global.staging="%IVY_HOME%\.sbt-staging" -Dmetlx.configurationFile="./config/configuration.local.xml" -Dlogback.configurationFile="config/logback.xml" -Drun.mode="development" -Dmetl.stopwatch.enabled="true" -Dmetl.stopwatch.minimumLog="1000" -Dstackable.spending=enabled -jar sbt-launch.jar %*
