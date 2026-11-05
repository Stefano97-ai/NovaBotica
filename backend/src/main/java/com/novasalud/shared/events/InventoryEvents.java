package com.novasalud.shared.events;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class InventoryEvents {
    public record Changed() {}
    private final ApplicationEventPublisher publisher;
    public InventoryEvents(ApplicationEventPublisher publisher) { this.publisher=publisher; }
    public void changed() { publisher.publishEvent(new Changed()); }
}
