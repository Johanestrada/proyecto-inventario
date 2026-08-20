package com.inventario.inventario.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Technical identity endpoint enabled only for the packaged client profile. */
@RestController
@Profile("cliente")
public class DesktopHealthController {

    @Value("${desktop.instance-token:}")
    private String instanceToken;

    @GetMapping("/internal/desktop/health")
    public Map<String, String> health() {
        return Map.of(
                "application", "Inventario",
                "profile", "cliente",
                "instanceToken", instanceToken);
    }
}
