#!/bin/bash

echo "Deployment started"
if ! ssh ubuntu@ec2-3-13mpute.amazonaws.com "
    echo 'Pruning Images'
    sudo docker image prune -f
    echo 'Images pruned'
    cd reusing-intent
    sudo docker-compose down
    echo 'docker-compose down -- completed'
    git reset --hard
    git checkout main
    echo 'Switched to main'
    git pull
    echo 'Pulled latest'
    sudo docker-compose up -d
    "
then
    echo "Failure"
    exit 1
else
    echo "Deployment complete!"
    exit 0
fi
