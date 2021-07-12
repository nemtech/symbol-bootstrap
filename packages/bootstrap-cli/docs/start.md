`symbol-bootstrap start`
========================

Single command that aggregates config, compose and run in one line!

* [`symbol-bootstrap start`](#symbol-bootstrap-start)

## `symbol-bootstrap start`

Single command that aggregates config, compose and run in one line!

```
USAGE
  $ symbol-bootstrap start

OPTIONS
  -a, --assembly=assembly
      The assembly that define the node(s) layout. It can be provided via custom preset or cli parameter. If not provided, 
      the value is resolved from the target/preset.yml file.

  -b, --build
      If provided, docker-compose will run with -b (--build)

  -c, --customPreset=customPreset
      External preset file. Values in this file will override the provided presets.

  -d, --detached
      If provided, docker-compose will run with -d (--detached) and this command will wait unit server is running before 
      returning

  -h, --help
      It shows the help of this command.

  -p, --preset=preset
      The network preset. It can be provided via custom preset or cli parameter. If not provided, the value is resolved 
      from the target/preset.yml file.

  -r, --reset
      It resets the configuration generating a new one.

  -t, --target=target
      [default: target] The target folder where the symbol-bootstrap network is generated

  -u, --user=user
      [default: current] User used to run docker images when creating configuration files like certificates or nemesis 
      block. "current" means the current user.

  --args=args
      Add extra arguments to the docker-compose up command. Check out https://docs.docker.com/compose/reference/up.

  --healthCheck
      It checks if the services created with docker compose are up and running.

      This command checks:
      - Whether the docker containers are running.
      - Whether the services' exposed ports are listening.
      - Whether the rest gateways' /node/health are OK.

      The health check process handles 'repeat' and custom 'openPort' services.

  --noPassword
      When provided, Bootstrap will not use a password, so private keys will be stored in plain text. Use with caution.

  --password=password
      A password used to encrypt and decrypt private keys in preset files like addresses.yml and preset.yml. Bootstrap 
      prompts for a password by default, can be provided in the command line (--password=XXXX) or disabled in the command 
      line (--noPassword).

  --pullImages
      It pulls the images from DockerHub when running the configuration. It only affects alpha/dev docker images.

  --report
      It generates reStructuredText (.rst) reports describing the configuration of each node.

  --resetData
      It reset the database and node data but keeps the generated configuration, keys, voting tree files and block 1

  --timeout=timeout
      [default: 60000] If running in detached mode, how long before timing out (in milliseconds)

  --upgrade
      It regenerates the configuration reusing the previous keys. Use this flag when upgrading the version of bootstrap to 
      keep your node up to date without dropping the local data. Backup the target folder before upgrading.

EXAMPLES
  $ symbol-bootstrap start -p singleCurrency -a multinode
  $ symbol-bootstrap start -p dualCurrency -a multinode
  $ symbol-bootstrap start -p testnet -a dual
  $ symbol-bootstrap start -p testnet -a dual --password 1234
  $ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap start -p testnet -a dual
```
