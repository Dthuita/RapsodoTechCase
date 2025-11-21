#!/bin/sh

#NOTE: on windows must run w/ git bash terminal not powershell or default

################### Simple Tests ###################

echo "[Simple Get Req Test]"
curl -X GET http://localhost:8081 

echo -e "\n\n[Simple Post Req Test]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"rand1": "value1", "rand2": "value2", "rand3": "val3"}' \
  http://localhost:8081

################### Bad Data Tests ###################

echo -e "\n\n[Missing userId Data Post Req Test]" #missing userId
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "auth-service",
    "type": "user_login",
    "payload": {
        "ip": "192.168.0.10"
    },
    "timestamp": "2025-08-22T14:00:00Z"
    }' \
  http://localhost:8081/event

echo -e "\n\n[Missing all Data Post Req Test]" #empty data
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8081/event

echo -e "\n\n[Missing source & payload Data Post Req Test]" #missing source and payload
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user_login",
    "timestamp": "2025-08-22T14:00:00Z"
    }' \
  http://localhost:8081/event

echo -e "\n\n[Missing type Data Post Req Test]" #missing type
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "auth-service",
    "payload": {
        "userId": "thingOne",
        "ip": "192.168.0.10"
    },
    "timestamp": "2025-08-22T14:00:00Z"
    }' \
  http://localhost:8081/event

################### Wrong Type Tests ###################
echo -e "\n\n[Wrong userId type Post Req Test]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "auth-service",
    "type": "user_login",
    "payload": {
        "userId": 12,
        "ip": "192.168.0.10"
    },
    "timestamp": "2025-08-22T14:00:00Z"
    }' \
  http://localhost:8081/event

echo -e "\n\n[Wrong type for all Data Post Req Test]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": 22,
    "type": "43",
    "payload": {
        "userId": 12,
        "ip": 192.1
    },
    "timestamp": 2025
    }' \
  http://localhost:8081/event

echo -e "\n\n[Wrong payload type Post Req Test]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "auth-service",
    "payload": [43, 653, 11],
    "timestamp": "2025-08-22T14:00:00Z"
    }' \
  http://localhost:8081/event


echo -e "\n\n[Wrong timestamp type & Missing Data Post Req Test]" 
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user_login",
    "timestamp": 2025
    }' \
  http://localhost:8081/event

echo -e "\n\n[Wrong timestamp format]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "email-service",
    "type": "user_login",
    "payload": {
        "userId": "853",
        "ip": "192.168.10.11"
    },
    "timestamp": "2025-08-1T3:34:38Z"
    }' \
  http://localhost:8081/event

################### Good Event Posts ###################
echo -e "\n\n[Good Event Post - UserId: 12]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "auth-service",
    "type": "user_login",
    "payload": {
        "userId": "12",
        "ip": "192.168.120.10"
    },
    "timestamp": "2025-11-22T12:20:45Z"
    }' \
  http://localhost:8081/event

echo -e "\n\n[Good Event Post - UserId: 52]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "payment-service",
    "type": "payment",
    "payload": {
        "userId": "52",
        "ip": "188.118.101.10"
    },
    "timestamp": "2025-08-22T14:00:00Z"
    }' \
  http://localhost:8081/event

echo -e "\n\n[Good Event Post - UserId: 853]"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "email-service",
    "type": "user_login",
    "payload": {
        "userId": "853",
        "ip": "192.168.10.11"
    },
    "timestamp": "2025-08-1T03:34:38Z"
    }' \
  http://localhost:8081/event


echo -e "\n\n[Good Event Post - UserId: 245]" 
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source": "chat-service",
    "type": "message",
    "payload": {
        "userId": "245",
        "ip": "112.84.0.10"
    },
    "timestamp": "2025-4-7T07:56:12Z"
    }' \
  http://localhost:8081/event


################## Good Event Gets ###################
echo -e "\n\n[Get source='auth-service' Events Logged - Exists]"
curl -X GET \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8081/events?source=auth-service | json_pp

echo -e "\n\n[Get source='login-service' Events Logged - Exists]"
curl -X GET \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8081/events?source=login-service | json_pp

echo -e "\n\n[Get source='auth-pass' Events Logged - Does NOT Exists]"
curl -X GET \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8081/events?source=auth-pass | json_pp

echo -e "\n\n[Get type='that guy' Events Logged - Exists]"
curl -X GET \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8081/events?type=that%20guy | json_pp

echo -e "\n\n[Get type='that other guy' Events Logged - Exists]"
curl -X GET \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8081/events?type=that%20other%20guy | json_pp

echo -e "\n\n[Get type='some guy' Events Logged - Does NOT Exists]"
curl -X GET \
  -d '{}' \
  http://localhost:8081/events?type=some%20guy | json_pp


echo -e "\n\n[Get source='login-service' & type='that other guy' Events Logged - Exists]"
curl "http://localhost:8081/events?source=login-service&type=that%20guy" | json_pp


echo -e "\n\n[Get source='login-service' & type='some guy' Events Logged - Does NOT Exists]"
curl "http://localhost:8081/events?source=login-service&type=some%20guy" | json_pp

echo -e "\n\n[Get All Events Logged]"
curl -X GET \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8081/events | json_pp



