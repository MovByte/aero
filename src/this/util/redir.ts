export default (url: string): Response =>
    new Response("", {
        status: 307,
        headers: {
            location: aeroConfig.prefix + url
        }
    });
