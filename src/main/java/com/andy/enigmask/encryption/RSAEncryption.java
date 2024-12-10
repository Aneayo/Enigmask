package com.andy.enigmask.encryption;

import java.security.InvalidKeyException;
import java.security.InvalidKeyException;
import java.security.InvalidParameterException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;

import java.security.Security;
import java.security.SecureRandom;

import java.util.Date;
import java.sql.Timestamp;

import org.bouncycastle.crypto.engines.AESEngine;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.crypto.engines.RSAEngine;
import org.bouncycastle.crypto.AsymmetricBlockCipher;
import org.bouncycastle.crypto.AsymmetricCipherKeyPair;

public class RSAEncryption {

    private final static String ALGORITHM = "RSA";
    private final static int KEY_SIZE = 1024;
    private final static int BUFFER_SIZE = 1024;

}
