package com.novasalud;

import java.nio.file.*;
import java.util.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude=org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
public class NovaSaludApplication {
    public static void main(String[] args) throws Exception {
        var app = new SpringApplication(NovaSaludApplication.class);
        // Local .env is optional. Environment variables and CLI arguments take precedence.
        Map<String,Object> defaults = new HashMap<>();
        Path env = Path.of(".env");
        if (Files.exists(env)) for (String line : Files.readAllLines(env)) {
            String text=line.trim(); int equals=text.indexOf('=');
            if (!text.startsWith("#") && equals>0) {
                String value=text.substring(equals+1).trim();
                if(value.length()>1 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) value=value.substring(1,value.length()-1);
                defaults.put(text.substring(0,equals).trim(),value);
            }
        }
        app.setDefaultProperties(defaults);
        boolean command = Arrays.stream(args).anyMatch(a -> a.startsWith("--nova.command="));
        if(command) app.setWebApplicationType(WebApplicationType.NONE);
        var context=app.run(args);
        if(command) context.close();
    }
}
