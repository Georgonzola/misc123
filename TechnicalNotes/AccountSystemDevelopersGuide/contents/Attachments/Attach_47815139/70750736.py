import sys
import re
import time
import optparse
import binascii
import Crypto.Cipher.AES
import base64
import hashlib

CLIENT_SECRET = "743177abbb8b14fba355c6b1661aad85"
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
    DecodeServiceTokenSample.py [OPTIONS] service_token
"""
p = optparse.OptionParser(usage=usage)
(opt, args) = p.parse_args()

if len(args) != 1:
    p.print_help()
    sys.exit(1)

crypt = Crypto.Cipher.AES.new(
                binascii.unhexlify(CLIENT_SECRET),
                Crypto.Cipher.AES.MODE_CBC,
                binascii.unhexlify("0"*2*BLOCK_SIZE)
                )

decrypted_service_token = pkcs7unpad(
                crypt.decrypt(
                    base64.b64decode(args[0])
                    ),
                BLOCK_SIZE
                )

r = re.compile(r'^(.+)\\h\\([0-9a-z]{8})$')
m = r.search(decrypted_service_token)
validation_string = m.group(1)
hash_string = m.group(2)
calchash = hashlib.sha1(validation_string).hexdigest()[0:8]
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
    print "Token expired now=%d timestamp=%s"%(now, timestamp);
    sys.exit(1)

print "Platform_ID: %s"%(platform_id,)
print "Principal_ID(PID): %s"%(principal_id,)
print "Account_ID: %s"%(account_id,)
print "Server_ENV: %s"%(server_env,)
print "Game_Version: %s"%(game_version,)
print "Unique_ID: %s"%(unique_id,)

sys.exit(0)
