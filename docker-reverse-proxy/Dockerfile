FROM nginx:latest
COPY default.conf /etc/nginx/conf.d/default.conf
RUN sed -i 's/ADDRESS/mediatracker.app/' /etc/nginx/conf.d/default.conf
