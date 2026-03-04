#!/usr/bin/env ruby
#
#
require 'base64'
require 'openssl'
require 'digest'

CLIENT_SECRET = File.read("../secret/client_secret")
CIPHER = "aes-128-cbc"

server_public_key = OpenSSL::PKey::RSA.new(File.read("../secret/server.key")).freeze

if ARGV.length !=2 and ARGV.length != 3
  STDERR.puts "usage: #$0 <service_token> <initial_vector> [signature]"
  exit 1
end

service_token_base64 = ARGV.shift
initial_vector_base64 = ARGV.shift
signature_base64 = ARGV.shift

#### decode
#
class String
  def bin()
    [self].pack("H*")
  end
end

decoder = OpenSSL::Cipher.new(CIPHER)
decoder.decrypt
decoder.key = CLIENT_SECRET.bin
decoder.iv = Base64.strict_decode64(initial_vector_base64)

plain = ''
plain << decoder.update(Base64.strict_decode64(service_token_base64))
plain << decoder.final

m = /^(.+)\\h\\([0-9a-f]{40})$/.match plain
validation_string = m[1]
hash_string = m[2]
calc_hash = Digest::SHA1.hexdigest(validation_string)
if calc_hash != hash_string
  STDERR.puts "Invalid hash: #{calc_hash} != #{hash_string}"
  exit 1
end

token_hash = Hash[plain.scan(/\\(\w)\\([^\\]+)/)]
platform_id = token_hash['z']
principal_id = token_hash['u']
account_id = token_hash['a']
server_env = token_hash['s']
game_version = token_hash['v']
unique_id = token_hash['e']
timestamp = token_hash['t']

now = Time.now
if now - Time.at(timestamp.to_i) > 24 * 60 * 60
  STDERR.puts "Warning: Token expired now=#{now}, timestamp=#{timestamp}"
end

puts "Platform_ID: #{platform_id}"
puts "Principal_ID(PID): #{principal_id}"
puts "Account_ID: #{account_id}"
puts "Server_ENV: #{server_env}"
puts "Game_Version: #{game_version}"
puts "Unique_ID: #{unique_id}"

if signature_base64
  signature = Base64.strict_decode64(signature_base64)
 result =  server_public_key.verify(OpenSSL::Digest::SHA256.new, signature, plain)
  if result
    puts "Signature: correct"
  else
    puts "Signature: vefiry failed"
  end
end
