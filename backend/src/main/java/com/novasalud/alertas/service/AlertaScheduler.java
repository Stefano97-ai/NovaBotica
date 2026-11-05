package com.novasalud.alertas.service;

import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.*;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@ConditionalOnWebApplication(type=ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name="nova.alerts.scheduling-enabled",havingValue="true",matchIfMissing=true)
public class AlertaScheduler {
    private final AlertaService service;
    public AlertaScheduler(AlertaService service) { this.service=service; }
    @EventListener(ApplicationReadyEvent.class)
    public void startup() { refresh(); }
    // Rechecks the calendar in Lima even on days without inventory operations, and recovers missed events.
    @Scheduled(fixedDelayString="${nova.alerts.reconcile-ms:60000}",initialDelayString="${nova.alerts.reconcile-ms:60000}")
    public void refresh() {
        try { service.reconcile(); }
        catch(Exception error) { LoggerFactory.getLogger(getClass()).error("No se pudo ejecutar la revisión de alertas.",error); }
    }
}
