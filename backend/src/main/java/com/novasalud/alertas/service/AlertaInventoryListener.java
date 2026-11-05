package com.novasalud.alertas.service;

import com.novasalud.shared.events.InventoryEvents;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;

@Component
public class AlertaInventoryListener {
    private final AlertaService service;
    public AlertaInventoryListener(AlertaService service) { this.service=service; }
    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    public void changed(InventoryEvents.Changed event) {
        // A notification failure must never turn an already committed sale into a reported failure.
        try { service.reconcile(); }
        catch(Exception error) { LoggerFactory.getLogger(getClass()).error("No se pudieron actualizar las alertas; la revisión periódica reintentará.",error); }
    }
}
