using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .mainWorker),
  ],

  sockets = [
    ( name = "http",
      address = "*:2525",
      http = (),
      service = "aero-proxy"
    ),
  ]
);

const mainWorker :Workerd.Worker = (
  serviceWorkerScript = embed "examples/deploy.sh",
  compatibilityDate = "2023-02-28",
  # Learn more about compatibility dates at:
  # https://developers.cloudflare.com/workers/platform/compatibility-dates/
);