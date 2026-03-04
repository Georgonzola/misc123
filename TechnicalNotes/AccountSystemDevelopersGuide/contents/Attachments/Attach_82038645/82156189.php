<?php

// Usage:
//require 'DecodeServiceTokenSampleV2.php';
//
//$token = DecryptServiceTokenV2("<SERVICE_TOKEN>", "<CLIENT_SECRET>", "<INITIAL_VECTOR>");
//$splitToken = SplitToken($token);
//$result = VerifyServiceTokenV2($token, "<SIGNATURE>");
//
//----
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

function DecryptServiceTokenV2($token_base64, $clientSecret, $iv_base64)
{
	$cipher = mcrypt_module_open(MCRYPT_RIJNDAEL_128, '', MCRYPT_MODE_CBC, '');
	$iv = base64_decode($iv_base64);

	if(mcrypt_generic_init($cipher, pack('H32', $clientSecret), $iv) == 0 )
	{
		$token = base64_decode($token_base64);
		//var_dump($data);
		$dataLen = strlen($token);
		$padBytes = $dataLen % (128/8);
		$data = str_pad($token, $dataLen + $padBytes, '\0');
		$decryptedToken = mdecrypt_generic($cipher, $data);
	   
		mcrypt_generic_deinit($cipher);
		mcrypt_module_close($cipher);
	   
		return unpadPKCS7($decryptedToken, 128/8);
	}


	return '';
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
	if(preg_match('#^(.+)\\\\h\\\\([0-9a-z]{40})$#i', $decryptedToken, $hashGroups) == 1)
	{
		$validationString = $hashGroups[1];
		$hash = $hashGroups[2];
		$calcHash = sha1($validationString);
		
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

//-- Verify

function VerifyServiceTokenV2($token, $sign_base64) //Use either this one or the MarkII below
{

	$pubkey = openssl_pkey_get_public(file_get_contents('./server.key'));
	$sign = base64_decode($sign_base64);
	return openssl_verify($token, $sign, $pubkey, "sha256WithRSAEncryption");
}


//-- Sample

$CLIENT_SECRET_HEX = "41b3544cb4faa430eb610ba1930f02ad";
$INITIAL_VECTOR_BASE64 = "ivJH+zmQre7UWB07/QBnwg==";
$SIGNATURE_BASE64 = "dWdqPMNUUXMtuxpOes9erVHQ8c3Z2Tv1cPVCqrRIvwhfZ9Mjr//7Nupv+7sM193i6ahwcrkcvnCAK3dyT7z55hC5j7Pjpl5evTJav66vN+f+QokmWMu6VGHEhgTW2ph7I6DMZ1LghR8kZnhPOrNEFCrprvarx/FWBdh0SopuxLZUOfYJxtggR6Vvcr44sYbL2cGZycoI2sO14Q24mrN9WP5ZwDorMF0Dr+mew4r0ZM2uhot1cCSxKeQm2+6pUV5hFyC164hUhQTxllnpP3hDLD1K3f2Dm5r8Rv7NltVDnHOXoP7b1/Q4U39aRm2pLaziPR92IyXMd82anBxjVezV2g==";
$SERVICE_TOKEN_BASE64 = "4hrVNQbFULaLyocZMRWt2nmO2FZTop6YDndJVpr1TjV7veygtAYJRnzYiomSnm0T7bmNucu6TcfqD3hXbaKBkZdSab4JSE2R4zsfq4Jv8ou1UBIaSNtWrFz2JyDddCGRsNn317+C4Zap15RoSRtSgZCKyYgCnBVQAJfwbeaGeN9uNXq/rv8jPGYg7+TWVAIu2JnJm5hTF/ED29iaPzknQQ==";

$token = DecryptServiceTokenV2($SERVICE_TOKEN_BASE64, $CLIENT_SECRET_HEX, $INITIAL_VECTOR_BASE64);
$splitToken = SplitToken($token);

if ($splitToken > 0)
{
	print "Platform_ID: {$splitToken['platformId']}\n";
	print "Principal_ID(PID): {$splitToken['principalId']}\n";
	print "Account_ID: {$splitToken['accountId']}\n";
	print "Server_ENV: {$splitToken['serverEnv']}\n";
	print "Game_Version: {$splitToken['gameVersion']}\n";
	print "Unique_ID: {$splitToken['uniqueId']}\n";
	$result = VerifyServiceTokenV2($token, $SIGNATURE_BASE64) == 1 ? "correct" : "incorrect";
	print "Signature: {$result}\n";
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
