#!/usr/bin/perl

use strict;
use warnings;
use MIME::Base64;
use Crypt::CBC;
use Digest::SHA1 qw(sha1_hex);
use File::Slurp;
use Crypt::OpenSSL::RSA;

my $CLIENT_SECRET = read_file("../secret/client_secret");
my $SERVER_PUBKEY = read_file("../secret/server.key");

if ($#ARGV != 2 && $#ARGV != 3) {
    print "perl DecodeServiceTokenSample.pl <SERVICE_TOKEN> <INITIAL_VECTOR> [SIGNATURE]\n";
    exit
}
my $service_token_base64 = $ARGV[0];
my $initial_vector_base64 = $ARGV[1];
my $signature_base64 = $ARGV[2];

my $cipher = Crypt::CBC->new(
    -key => pack("H32", $CLIENT_SECRET),
    -keysize => 16,
    -literal_key => 1,
    -cipher => "Crypt::OpenSSL::AES",
    -iv => decode_base64($initial_vector_base64),
    -header => 'none',
    );

my $decrypted_service_token = $cipher->decrypt(decode_base64($service_token_base64));

my ($validation_string, $hash_string) = ($decrypted_service_token =~ /^(.+)\\h\\([0-9a-z]{40})$/);
my $calchash = sha1_hex($validation_string);
if ($calchash ne $hash_string) {
    print "Invalid hash ${calchash} != ${hash_string}\n";
    exit(1);
}

my $platform_id  = ($decrypted_service_token =~ /\\z\\(\d+)/)[0];
my $principal_id = ($decrypted_service_token =~ /\\u\\(\d+)/)[0];
my $account_id   = ($decrypted_service_token =~ /\\a\\([0-9a-zA-Z\-_\.]{6,16})/)[0];
my $server_env   = ($decrypted_service_token =~ /\\s\\([A-Z]\d)/)[0];
my $game_version = ($decrypted_service_token =~ /\\v\\([0-9A-F]{4})/)[0];
my $unique_id    = ($decrypted_service_token =~ /\\e\\([0-9A-F]{5})/)[0];
my $timestamp    = ($decrypted_service_token =~ /\\t\\(\d+)/)[0];

my $now = time;
if ($now - $timestamp > 24 * 60 * 60) {
    print "Warning: Token expired now=${now} timestamp=${timestamp}\n";
}

print "Platform_ID: ${platform_id}\n";
print "Principal_ID(PID): ${principal_id}\n";
print "Account_ID: ${account_id}\n";
print "Server_ENV: ${server_env}\n";
print "Game_Version: ${game_version}\n";
print "Unique_ID: ${unique_id}\n";

if ($signature_base64) {
  my $key = Crypt::OpenSSL::RSA->new_public_key($SERVER_PUBKEY);
  $key->use_sha256_hash();
  if ($key->verify($decrypted_service_token, decode_base64($signature_base64))) {
    print "Signature: correct\n";
  } else {
    print "Signature: verify failed\n";
  }
}

exit(0);
