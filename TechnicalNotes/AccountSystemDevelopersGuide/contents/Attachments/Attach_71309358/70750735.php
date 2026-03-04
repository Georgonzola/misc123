<?php

// Usage:
//require 'DecodeServiceTokenSample.php';
//
//$token = DecryptServiceToken("<SERVICE_TOKEN>", "<CLIENT_SECRET>");
//$splitToken = SplitToken($token);
//
//----
//DecryptServiceToken is provided in two versions. The second version is simpler and maybe faster, but require the OpenSSL library.
//----
//SplitToken return either an array with the different part of the service token (see at the bottom of the file) or an error code:
//-1: The token was badly formed.
//-2: The token hash was mismatching.
//-3: The token had expired.

//-- Decrypting

function unpadPKCS7($data, $blocksize)
{
	$last = substr($data, -1);
	return substr($data, 0, strlen($data) - ord($last));
}

function DecryptServiceToken($token, $clientSecret) //Use either this one or the MarkII below
{
	$cipher = mcrypt_module_open(MCRYPT_RIJNDAEL_128, '', MCRYPT_MODE_CBC, '');

	if(mcrypt_generic_init($cipher, pack('H32', $clientSecret), pack('C16', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0) ) == 0 )
	{
		$data = base64_decode($token);
		//var_dump($data);
		$dataLen = strlen($data);
		$padBytes = $dataLen % (128/8);
		$data = str_pad($data, $dataLen + $padBytes, '\0');
		$decryptedToken = mdecrypt_generic($cipher, $data);
	   
		mcrypt_generic_deinit($cipher);
		mcrypt_module_close($cipher);
	   
		return unpadPKCS7($decryptedToken, 128/8);
	}


	return '';
}

function DecryptServiceToken2($token, $clientSecret)
{
    return openssl_decrypt($token, 'aes-128-cbc', pack('H32', $clientSecret));
}

//-- Reading

function GetTokenPart($decryptedToken, $id, $capture)
{
	if(preg_match('#\\\\' . $id . '\\\\(' . $capture . ')#', $decryptedToken, $matches) == 1)
		return $matches[1];
	
	return FALSE;
}

function SplitToken($decryptedToken)
{
	if(preg_match('#^(.+)\\\\h\\\\([0-9a-z]{8})$#i', $decryptedToken, $hashGroups) == 1)
	{
		$validationString = $hashGroups[1];
		$hash = $hashGroups[2];
		$calcHash = substr(sha1($validationString), 0, 8);
		
		if($calcHash == $hash)
		{
			$splitToken['platformId'] = GetTokenPart($decryptedToken, 'z', '\d+');
			$splitToken['principalId'] = GetTokenPart($decryptedToken, 'u', '\d+');
			$splitToken['accountId'] = GetTokenPart($decryptedToken, 'a', '[0-9a-zA-Z\\-\\_\\.]{6,16}');
			$splitToken['serverEnv'] = GetTokenPart($decryptedToken, 's', '[A-Za-z]\d');
			$splitToken['gameVersion'] = GetTokenPart($decryptedToken, 'v', '[0-9A-Fa-f]{4}');
			$splitToken['uniqueId'] = GetTokenPart($decryptedToken, 'e', '[0-9A-Fa-f]{5}');
			$splitToken['timestamp'] = GetTokenPart($decryptedToken, 't', '\d+');
			
			//This check that the token is not more than a day old. You may change this duration according to your application.
			if(time() - (int)$splitToken['timestamp'] > 24*60*60)
			{
				return -3;
			}
			
			return $splitToken;
		}
		
		return -1;
	}
	
	return -2;
}

//-- Sample

$CLIENT_SECRET = "";
$SERVICE_TOKEN = "";

$token = DecryptServiceToken($SERVICE_TOKEN, $CLIENT_SECRET);
$splitToken = SplitToken($token);

if ($splitToken > 0)
{
	print "Platform_ID: {$splitToken['platformId']}\n";
	print "Principal_ID(PID): {$splitToken['principalId']}\n";
	print "Account_ID: {$splitToken['accountId']}\n";
	print "Server_ENV: {$splitToken['serverEnv']}\n";
	print "Game_Version: {$splitToken['gameVersion']}\n";
	print "Unique_ID: {$splitToken['uniqueId']}\n";
}
else
{
	if ($splitToken == -1)
	{
		print "Hash mismatch.\n";
	}
	else if ($splitToken == -2)
	{
		print "Invalid format.\n";
	}
	else if ($splitToken == -3)
	{
		print "Token expired.\n";
	}
}

?>