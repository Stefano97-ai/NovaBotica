package com.novasalud;
import com.novasalud.modules.auth.service.PasswordService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class PasswordCompatibilityTest {
 @Test void acceptsNodeScryptAndUnicode(){
  var passwords=new PasswordService();
  String nodeHash="scrypt-v1$0123456789abcdef0123456789abcdef$291a5ca1e1276bef6b2b69aa3bebb23e0c934124228f7b2d3073f7110e888970c02bf2a2e797cb6c3d30e0b5be7dacc45b608b0b8fad60e5ea8264b63a9c5ab2";
  assertTrue(passwords.verify("Compatibilidad ñ 2026",nodeHash));assertFalse(passwords.verify("otra",nodeHash));
  assertTrue(passwords.verify("nueva",passwords.hash("nueva")));assertFalse(passwords.verify("nueva","malformed"));
 }
}
