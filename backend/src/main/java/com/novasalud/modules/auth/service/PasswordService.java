package com.novasalud.modules.auth.service;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.stereotype.Component;
@Component
public class PasswordService {
    private final SecureRandom random=new SecureRandom();
    public String randomHex(int bytes) {byte[] value=new byte[bytes];random.nextBytes(value);return HexFormat.of().formatHex(value);}
    public String hash(String password) {String salt=randomHex(16);return "scrypt-v1$"+salt+"$"+HexFormat.of().formatHex(derive(password,salt));}
    private byte[] derive(String password,String salt) {
        // Node used the hexadecimal salt as a UTF-8 STRING, not decoded salt bytes.
        return SCrypt.generate(password.getBytes(StandardCharsets.UTF_8),salt.getBytes(StandardCharsets.UTF_8),32768,8,3,64);
    }
    public boolean verify(String password,String encoded) {
        if(encoded==null || !encoded.matches("scrypt-v1\\$[a-f0-9]{32}\\$[a-f0-9]{128}"))return false;
        String[] parts=encoded.split("\\$");return MessageDigest.isEqual(derive(password,parts[1]),HexFormat.of().parseHex(parts[2]));
    }
    public static String sha256(String text) {
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));}
        catch(NoSuchAlgorithmException impossible){throw new IllegalStateException(impossible);}
    }
}
