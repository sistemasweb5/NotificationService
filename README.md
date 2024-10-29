# NotificationService

To run the server:


- npm install (first time)
- sudo docker-compose up --build


To Test logs: 
- sudo docker logs -f notificationservice-notificationservice-app-1
- node <fileName>.js


To Restore Server:

- sudo docker-compose down 
(if it doesn't work, restart docker service with:)

- sudo docker network prune
- sudo rm /var/lib/docker/network/files/local-kv.db
- sudo systemctl restart docker
- sudo docker-compose up --build