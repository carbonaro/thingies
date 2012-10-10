thingies
========

Simple Node.js backed connected device manager

## Usage

Register your device by adding an authorization key in key in Redis:

    HSET authorized_keys <your_key> <your_app_name>
    
For instance, assuming I want to refer to my Raspberry Pi as my_raspberry_pi and 
git it the key:

    HSET authorized_keys 5eec8e1caba298af9cb3ba60cf956c4f98ea2d1f my_raspberry_pi
    
On my Raspberry Pi, make sure to send a POST request on my server

    POST /my_raspberry_pi?key=5eec8e1caba298af9cb3ba60cf956c4f98ea2d1f
    
With the following params sent in the request body:

* private_ip
* public_ip

For example:

    curl -X POST 'http://example.com/my_raspberry_pi?key=5eec8e1caba298af9cb3ba60cf956c4f98ea2d1f' \
        -d 'private_ip=192.168.0.1' \
        -d 'public_ip=8.8.8.8'

You can put that in a cron or use the thingup.sh script. First argument is the URI pointing to your 
thing. Second argument is the key.

    script/thingup.sh http://example.com/my_raspberry_by 5eec8e1caba298af9cb3ba60cf956c4f98ea2d1f
