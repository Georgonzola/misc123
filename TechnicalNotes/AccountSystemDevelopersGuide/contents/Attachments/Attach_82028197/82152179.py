#!/usr/bin/env python
import sys
import re
import time
import optparse
import binascii
import Crypto.Cipher.AES
from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5
from Crypto.Hash import SHA256
from Crypto.Hash import SHA
import base64
import hashlib

CLIENT_SECRET = open("../secret/client_secret").read().rstrip()
serverPublicKey = open("../secret/server.key").read()
BLOCK_SIZE = 16

def pkcs7unpad(text, blocksize):
    if text:
        padlen = ord(text[-1])
        if padlen and padlen <= blocksize:
            text = text[:-padlen]
        else:
            raise Exception
    return text

usage = """
    DecodeServiceTokenSample.py [OPTIONS] service_token initial_vector [signature]
"""
p = optparse.OptionParser(usage=usage)
(opt, args) = p.parse_args()

if len(args) != 2 and len(args) != 3:
    p.print_help()
    sys.exit(1)

service_token_base64 = args[0]
initial_vector_base64 = args[1]

if len(args)==3:
    signature_base64 = args[2]
else:
    signature_base64 = None

crypt = Crypto.Cipher.AES.new(
                binascii.unhexlify(CLIENT_SECRET),
                Crypto.Cipher.AES.MODE_CBC,
                base64.b64decode(initial_vector_base64)
                )

decrypted_service_token = pkcs7unpad(
                crypt.decrypt(base64.b64decode(service_token_base64)),
                BLOCK_SIZE
                )

r = re.compile(r'^(.+)\\h\\([0-9a-f]{40})$')
m = r.search(decrypted_service_token)
validation_string = m.group(1)
hash_string = m.group(2)
calchash = hashlib.sha1(validation_string).hexdigest()
if calchash != hash_string:
    print "Invalid hash %s != %s"%(calchash, hash_string)
    sys.exit(1)

platform_id  = re.compile(r'\\z\\(\d+)').search(validation_string).group(1)
principal_id = re.compile(r'\\u\\(\d+)').search(validation_string).group(1)
account_id   = re.compile(r'\\a\\([0-9a-zA-Z\-_\.]{6,16})').search(validation_string).group(1)
server_env   = re.compile(r'\\s\\([A-Z]\d)').search(validation_string).group(1)
game_version = re.compile(r'\\v\\([0-9A-F]{4})').search(validation_string).group(1)
unique_id    = re.compile(r'\\e\\([0-9A-F]{5})').search(validation_string).group(1)
timestamp    = re.compile(r'\\t\\(\d+)').search(validation_string).group(1)

now = int(time.time())
if now - int(timestamp) > 24 * 60 * 60:
    print "Warning: Token expired now=%d timestamp=%s"%(now, timestamp);

print "Platform_ID: %s"%(platform_id,)
print "Principal_ID(PID): %s"%(principal_id,)
print "Account_ID: %s"%(account_id,)
print "Server_ENV: %s"%(server_env,)
print "Game_Version: %s"%(game_version,)
print "Unique_ID: %s"%(unique_id,)

if signature_base64:
    key = RSA.importKey(serverPublicKey)
    verifier = PKCS1_v1_5.new(key)
    digest = SHA256.new(decrypted_service_token)

    if verifier.verify(digest, base64.b64decode(signature_base64)):
	print "Signature: correct"
    else:
	print "Signature: vefiry failed"

sys.exit(0)
