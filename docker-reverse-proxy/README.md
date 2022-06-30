# HTTPS with [Nginx](https://hub.docker.com/_/nginx) reverse proxy

Place `fullchain.pem` and `privkey.pem` in `~/ssl/private`

```bash
git clone https://github.com/bonukai/MediaTracker.git
docker-compose --file MediaTracker/docker-reverse-proxy/docker-compose.yaml up --build --detach
```
